'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { rnEditThreshold, rnEditThresholdDisplay } from '../../../utils/constants';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';
import { FileInput, FileDisplay } from '../../file-input';
import SourceSelector from './source-selector';
import { CatalogSource } from './catalog-source';

class ModalRoadNetwork extends ModalBase {
  constructor (props) {
    super(props);
    this.initState(props);

    this.onSourceChange = this.onSourceChange.bind(this);
    this.onWbCatalogOptSelect = this.onWbCatalogOptSelect.bind(this);
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.revealed && nextProps.revealed) {
      this.initState(nextProps);
    }
  }

  initState (props) {
    let fileField;
    if (props.sourceData.files.length) {
      fileField = props.sourceData.files[0];
    } else {
      fileField = {
        file: null,
        size: 0,
        uploaded: 0
      };
    }

    this.state = {
      source: props.sourceData.type || 'file',
      fileField,
      fileToRemove: null,
      wbCatalogOption: ''
    };
  }

  // @common All source modals.
  onSourceChange (event) {
    const source = event.target.value;
    this.setState({ source });
  }

  // @common All source modals.
  onWbCatalogOptSelect (option) {
    this.setState({ wbCatalogOption: option });
  }

  onFileSelected (id, file, event) {
    let fileField = _.clone(this.state.fileField);

    // Store file reference.
    fileField.file = file;
    fileField.size = file.size;
    fileField.uploaded = 0;

    this.setState({ fileField });

    if (file.size >= rnEditThreshold) {
      let msg = t('File size is above {size}. Road network editing will be disabled.', {
        size: rnEditThresholdDisplay
      });
      this.props._showAlert('warning', <p>{msg}</p>, true);
    }
  }

  onFileRemove (id, event) {
    let fileField = {
      file: null,
      size: 0,
      uploaded: 0
    };

    this.setState({
      fileField,
      fileToRemove: id
    });
  }

  allowSubmit () {
    if (this.state.source === 'osm') {
      return true;
    } else if (this.state.source === 'file') {
      // New file, one to remove or both.
      return this.state.fileToRemove || this.state.fileField.file;
    } else if (this.state.source === 'wbcatalog') {
      return !!this.state.wbCatalogOption;
    }
    return false;
  }

  onSubmit () {
    showGlobalLoading();

    // Delete action.
    let deleteFilesPromiseFn = () => Promise.resolve();
    if (this.state.fileToRemove) {
      deleteFilesPromiseFn = () => {
        return fetchJSON(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/files/${this.state.fileToRemove}`, {method: 'DELETE'})
          .then(() => {
            this.setState({fileToRemove: null});
          })
          .catch(err => {
            let msg = t('An error occurred while deleting file {filename}: {message}', {
              filename: this.state.fileField.name,
              message: err.message
            });
            this.props._showAlert('danger', <p>{msg}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      };
    }

    // Data to submit.
    let newFilesPromiseFn = () => Promise.resolve();
    if (this.state.source === 'file' && this.state.fileField.file) {
      newFilesPromiseFn = () => {
        let formData = new FormData();
        formData.append('source-type', 'file');
        formData.append('source-name', 'road-network');
        formData.append('file', this.state.fileField.file);

        let onProgress = progress => {
          let fileField = _.clone(this.state.fileField);
          fileField.uploaded = progress;
          this.setState({fileField});
        };

        let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/source-data`, formData, onProgress);
        // this.xhr = xhr;
        return promise
          .then(res => {
            let fileField = _.clone(this.state.fileField);
            fileField = res;
            this.setState({fileField});
          })
          .catch(err => {
            let msg = t('An error occurred while uploading the road network file: {message}', {
              message: err.message
            });
            this.props._showAlert('danger', <p>{msg}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      };
    }

    if (this.state.source === 'osm' || this.state.source === 'wbcatalog') {
      newFilesPromiseFn = () => {
        let formData = new FormData();
        formData.append('source-type', this.state.source);
        formData.append('source-name', 'road-network');
        if (this.state.source === 'wbcatalog') {
          // Using key for consistency reasons across all sources.
          formData.append('wbcatalog-options[key]', this.state.wbCatalogOption);
        }

        let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/source-data`, formData, () => {});
        // this.xhr = xhr;
        return promise
          .catch(err => {
            let msg = t('An error occurred while saving the road network source: {message}', {
              message: err.message
            });
            this.props._showAlert('danger', <p>{msg}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      };
    }

    deleteFilesPromiseFn()
      .then(() => newFilesPromiseFn())
      .then(res => {
        this.setState({fileToRemove: null});
        hideGlobalLoading();
        this.props._showAlert('success', <p>{t('Road Network source successfully saved')}</p>, true, 4500);
        this.props.onCloseClick(true);
      })
      .catch(e => {
        hideGlobalLoading();
      });
  }

  renderSourceFile () {
    let { fileField } = this.state;
    let hasFile = !!fileField.created_at;

    if (hasFile) {
      return (
        <FileDisplay
          id='road-network'
          name='road-network'
          value={fileField.name}
          onRemoveClick={this.onFileRemove.bind(this, fileField.id)} />
      );
    } else {
      return (
        <FileInput
          id='road-network'
          name='road-network'
          value={fileField.file}
          placeholder={t('Choose a file')}
          onFileSelect={this.onFileSelected.bind(this, fileField.id)} >

          {fileField.file !== null
            ? <p className='form__help'>{Math.round(fileField.uploaded / (1024 * 1024))}MB / {Math.round(fileField.size / (1024 * 1024))}MB</p>
            : null
          }
        </FileInput>
      );
    }
  }

  renderSourceCatalog () {
    return (
      <CatalogSource
        type='road-network'
        selectedOption={this.state.wbCatalogOption}
        onChange={this.onWbCatalogOptSelect} />
    );
  }

  renderBody () {
    const sourceOptions = [
      {id: 'file', name: t('Custom upload')},
      {id: 'osm', name: t('OSM data')},
      {id: 'wbcatalog', name: t('WB Catalog')}
    ];

    return (
      <ModalBody>
        <form className='form' onSubmit={ e => { e.preventDefault(); this.allowSubmit() && this.onSubmit(); } }>
          <div className='form__group'>
            <label className='form__label'>{t('Source')}</label>
            <SourceSelector
              options={sourceOptions}
              selectedOption={this.state.source}
              onChange={this.onSourceChange} />
          </div>
          {this.state.source === 'file' ? this.renderSourceFile() : null}
          {this.state.source === 'osm' && <div className='form__note'><p>{t('Import road network data for the project\'s Administrative Boundaries from OpenStreetMap. For more fine-grained control, upload a file with custom road network data.')}</p><p>{t('When the resulting import is over {max} the road network editing will be disabled.', {max: rnEditThresholdDisplay})}</p></div>}
          {this.state.source === 'wbcatalog' ? this.renderSourceCatalog() : null}
        </form>
      </ModalBody>
    );
  }
}

ModalRoadNetwork.propTypes = {
  sourceData: T.object,
  projectId: T.number,
  scenarioId: T.number,
  _showAlert: T.func,
  _showGlobalLoading: T.func,
  _hideGlobalLoading: T.func
};

export default ModalRoadNetwork;
