'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';

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
      fileField,
      fileToRemove: null
    };
  }

  onFileSelected (id, event) {
    let fileField = _.clone(this.state.fileField);

    // Store file reference.
    const file = event.target.files[0];
    fileField.file = file;
    fileField.size = file.size;
    fileField.uploaded = 0;

    this.setState({ fileField });
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
    if (this.state.fileField.file) {
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
            this.props._showAlert('danger', <p>An error occurred while uploading profile file: {err.message}</p>, true);
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

  renderBody () {
    let { fileField } = this.state;
    let hasFile = !!fileField.created_at;
    return (
      <ModalBody>
        <form className='form' onSubmit={ e => { e.preventDefault(); this.allowSubmit() && this.onSubmit(); } }>
        {hasFile ? (
          <div className='form__group'>
            <label className='form__label' htmlFor='profile'>{t('Source')}</label>
            <div className='form__input-group'>
              <input type='text' id='profile' name='profile' className='form__control' placeholder={fileField.name} readOnly />
              <div className='form__input-addon'>
                <button
                  type='button'
                  className='button button--danger-plain button--text-hidden'
                  onClick={this.onFileRemove.bind(this, fileField.id)}
                  title={t('Remove file')}>
                  <i className='collecticon-trash-bin'></i><span>{t('Remove file')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className='form__group'>
            <label className='form__label' htmlFor='profile'>{t('Source')}</label>
            <input
              type='file'
              id='profile'
              name='profile'
              className='form__control'
              placeholder={t('Select a profile file')}
              onChange={this.onFileSelected.bind(this, fileField.id)}
            />
            {fileField.file !== null
              ? <p className='form__help'>{Math.round(fileField.uploaded / (1024 * 1024))}MB / {Math.round(fileField.size / (1024 * 1024))}MB</p>
              : null
            }
          </div>
        )}
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
