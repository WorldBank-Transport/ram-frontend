'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';
import ReactTooltip from 'react-tooltip';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { rnEditThreshold, rnEditThresholdDisplay } from '../../../utils/constants';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';
import { FileInput, FileDisplay } from '../../file-input';

class ModalRoadNetwork extends ModalBase {
  constructor (props) {
    super(props);
    this.initState(props);
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
      fileToRemove: null
    };
  }

  onFileSelected (id, file, event) {
    let fileField = _.clone(this.state.fileField);

    // Store file reference.
    fileField.file = file;
    fileField.size = file.size;
    fileField.uploaded = 0;

    this.setState({ fileField });

    if (file.size >= rnEditThreshold) {
      this.props._showAlert('warning', <p>File size is above {rnEditThresholdDisplay}. Road network editing will be disabled.</p>, true);
    }
  }

  onSourceChange (event) {
    this.setState({ source: event.target.value });
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
    }

    // All files need a subtype and a file.
    return this.state.fileToRemove || this.state.fileField.file;
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
            this.props._showAlert('danger', <p>An error occurred while deleting file {this.state.fileField.name}: {err.message}</p>, true);
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
            this.props._showAlert('danger', <p>An error occurred while uploading the road network file: {err.message}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      };
    }

    if (this.state.source === 'osm') {
      newFilesPromiseFn = () => {
        let formData = new FormData();
        formData.append('source-type', 'osm');
        formData.append('source-name', 'road-network');

        let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/source-data`, formData, () => {});
        // this.xhr = xhr;
        return promise
          .catch(err => {
            this.props._showAlert('danger', <p>An error occurred while saving the road network source: {err.message}</p>, true);
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

  renderBody () {
    return (
      <ModalBody>
        <form className='form' onSubmit={ e => { e.preventDefault(); this.allowSubmit() && this.onSubmit(); } }>
          <div className='form__group'>
            <label className='form__label'>Source</label>

            <label className='form__option form__option--inline form__option--custom-radio'>
              <input type='radio' name='source-type' id='file' value='file' checked={this.state.source === 'file'} onChange={this.onSourceChange.bind(this)} />
              <span className='form__option__text'>File upload</span>
              <span className='form__option__ui'></span>
            </label>

            <label data-tip={t('Coming soon')} data-effect='solid' className='form__option form__option--inline form__option--custom-radio visually-disabled'>
              <input type='radio' name='source-type' id='osm' value='osm' checked={this.state.source === 'osm'} onChange={this.onSourceChange.bind(this)} disabled />
              <span className='form__option__text'>OSM data</span>
              <span className='form__option__ui'></span>
            </label>
          </div>
          {this.state.source === 'file' ? this.renderSourceFile() : null}
          {this.state.source === 'osm' && <p>{t('Import road network data for the project\'s Administrative Boundaries from OpenStreetMap. For more fine-grained control, upload a file with custom road network data.')}</p>}
          {this.state.source === 'osm' && <p>{t('When the resulting import is over {max} the road network editing will be disabled.', {max: rnEditThresholdDisplay})}</p>}
        </form>

        <ReactTooltip />
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
