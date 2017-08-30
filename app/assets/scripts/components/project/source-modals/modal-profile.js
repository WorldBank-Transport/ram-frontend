'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';
import { FileInput, FileDisplay } from '../../file-input';

class ModalProfile extends ModalBase {
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
      source: props.sourceData.type || 'default',
      fileField,
      fileToRemove: null
    };
  }

  onFileSelected (id, file) {
    let fileField = _.clone(this.state.fileField);

    // Store file reference.
    fileField.file = file;
    fileField.size = file.size;
    fileField.uploaded = 0;

    this.setState({ fileField });
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
    if (this.state.source === 'default') {
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
        return fetchJSON(`${config.api}/projects/${this.props.projectId}/files/${this.state.fileToRemove}`, {method: 'DELETE'})
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
        formData.append('source-name', 'profile');
        formData.append('file', this.state.fileField.file);

        let onProgress = progress => {
          let fileField = _.clone(this.state.fileField);
          fileField.uploaded = progress;
          this.setState({fileField});
        };

        let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/source-data`, formData, onProgress);
        // this.xhr = xhr;
        return promise
          .then(res => {
            let fileField = _.clone(this.state.fileField);
            fileField = res;
            this.setState({fileField});
          })
          .catch(err => {
            this.props._showAlert('danger', <p>An error occurred while uploading profile source: {err.message}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      };
    }

    if (this.state.source === 'default') {
      newFilesPromiseFn = () => {
        let formData = new FormData();
        formData.append('source-type', 'default');
        formData.append('source-name', 'profile');

        let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/source-data`, formData, () => {});
        // this.xhr = xhr;
        return promise
          .catch(err => {
            this.props._showAlert('danger', <p>An error occurred while saving the profile source: {err.message}</p>, true);
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
        this.props._showAlert('success', <p>{t('Profile source successfully saved')}</p>, true, 4500);
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
          id='profile'
          name='profile'
          value={fileField.name}
          onRemoveClick={this.onFileRemove.bind(this, fileField.id)} />
      );
    } else {
      return (
        <FileInput
          id='profile'
          name='profile'
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
              <input type='radio' name='source-type' id='default' value='default' checked={this.state.source === 'default'} onChange={this.onSourceChange.bind(this)} />
              <span className='form__option__text'>{t('Default profile')}</span>
              <span className='form__option__ui'></span>
            </label>

            <label className='form__option form__option--inline form__option--custom-radio'>
              <input type='radio' name='source-type' id='file' value='file' checked={this.state.source === 'file'} onChange={this.onSourceChange.bind(this)} />
              <span className='form__option__text'>{t('Custom upload')}</span>
              <span className='form__option__ui'></span>
            </label>

          </div>
          {this.state.source === 'file' ? this.renderSourceFile() : null}
          {this.state.source === 'default' && <p>{t('The default OSRM profile assumes OSM-style road network data. For a customized profile, download the {link} and upload it.', {link: <a href={`${config.api}/files/source-data/default.profile.lua`} title={t('Download default profile.lua file')} target='_blank'>{t('default file')}</a>})}</p>}
        </form>
      </ModalBody>
    );
  }
}

ModalProfile.propTypes = {
  sourceData: T.object,
  projectId: T.number,
  _showAlert: T.func,
  _showGlobalLoading: T.func,
  _hideGlobalLoading: T.func
};

export default ModalProfile;
