'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import config from '../../../config';
import { limitHelper } from '../../../utils/utils';
import { t } from '../../../utils/i18n';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';

var subtypeLimit = limitHelper(15);

class ModalPoi extends ModalBase {
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
    let fileFields = props.sourceData.files.concat(this.getBasePoiFileField());

    this.state = {
      source: props.sourceData.type || 'file',
      fileFields,
      filesToRemove: []
    };
  }

  getBasePoiFileField () {
    return {
      id: _.uniqueId('poi-file'),
      subtype: '',
      file: null,
      size: 0,
      uploaded: 0
    };
  }

  addPoiFileField () {
    let fileFields = this.state.fileFields.concat(this.getBasePoiFileField());
    this.setState({fileFields});
  }

  removePoiFileField (id) {
    let fileFields = _.filter(this.state.fileFields, o => o.id !== id);
    this.setState({fileFields});
  }

  removeUploadedFile (id) {
    this.removePoiFileField(id);
    this.setState({filesToRemove: this.state.filesToRemove.concat(id)});
  }

  onFileSelected (id, event) {
    let fileFields = _.clone(this.state.fileFields);
    const idx = _.findIndex(fileFields, ['id', id]);

    // Store file reference.
    const file = event.target.files[0];
    fileFields[idx].file = file;
    fileFields[idx].size = file.size;
    fileFields[idx].uploaded = 0;

    this.setState({ fileFields });
  }

  onSubtypeChange (id, event) {
    let fileFields = _.clone(this.state.fileFields);
    const idx = _.findIndex(fileFields, ['id', id]);

    const subtype = event.target.value;
    fileFields[idx].subtype = subtype;

    this.setState({ fileFields });
  }

  allowSubmit () {
    // Is there just one new file?
    // The last new field input can't be removed so it must be checked
    // in separate.
    if (this.state.fileFields.length === 1) {
      // Is this correctly filled?
      let f = this.state.fileFields[0];
      let isEmpty = !f.file && !f.subtype;
      let isValid = f.file && f.subtype && subtypeLimit(f.subtype.length).isOk();

      if (isValid) {
        return true;
      }

      if (isEmpty) {
        // Was another file removed?
        return !!this.state.filesToRemove.length;
      }

      // If not nothing was done so there's nothing to submit.
      return false;
    }

    // All files need a subtype and a file.
    return this.state.filesToRemove.length || this.state.fileFields.every(f => f.created_at || (f.file && f.subtype && subtypeLimit(f.subtype.length).isOk()));
  }

  onSubmit () {
    showGlobalLoading();

    let deleteFilesPromiseFn = this.state.filesToRemove.map(o => () => {
      return fetchJSON(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/files/${o}`, {method: 'DELETE'})
        .then(() => {
          let filesToRemove = _.without(this.state.filesToRemove, o);
          this.setState({filesToRemove});
        })
        .catch(err => {
          let f = _.find(this.state.fileFields, {id: o});
          this.props._showAlert('danger', <p>An error occurred while deleting file {f.name}: {err.message}</p>, true);
          // Rethrow to stop chain.
          throw err;
        });
    });

    // Data to submit.
    let newFilesPromiseFn = this.state.fileFields.filter(o => !o.created_at && o.file).map(o => () => {
      let formData = new FormData();
      formData.append('source-type', 'file');
      formData.append('source-name', 'poi');
      formData.append('subtype', o.subtype);
      formData.append('file', o.file);

      const fileIdx = _.findIndex(this.state.fileFields, ['id', o.id]);

      let onProgress = progress => {
        let fileFields = _.clone(this.state.fileFields);
        fileFields[fileIdx].uploaded = progress;
        this.setState({fileFields});
      };

      let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/source-data`, formData, onProgress);
      // this.xhr = xhr;
      return promise
        .then(res => {
          let fileFields = _.clone(this.state.fileFields);
          fileFields[fileIdx] = res;
          this.setState({fileFields});
        })
        .catch(err => {
          this.props._showAlert('danger', <p>An error occurred while uploading file {o.subtype}: {err.message}</p>, true);
          // Rethrow to stop chain.
          throw err;
        });
    });

    let resolver = Promise.resolve();
    deleteFilesPromiseFn.concat(newFilesPromiseFn).forEach(promise => {
      resolver = resolver.then(() => promise());
    });

    resolver
      .then(res => {
        // Add new field if there isn't one.
        let hasEmpty = this.state.fileFields.some(o => !o.created_at);
        if (!hasEmpty) {
          this.addPoiFileField();
        }
        this.setState({filesToRemove: []});
        hideGlobalLoading();
        this.props._showAlert('success', <p>{t('Point of interest source successfully saved')}</p>, true, 4500);
        this.props.onCloseClick(true);
      })
      .catch(e => {
        hideGlobalLoading();
      });
  }

  renderFileFieldset (fileField, i, all) {
    if (fileField.created_at) {
      return (
        <fieldset className='form__fieldset' key={fileField.id}>
          <div className='form__inner-header'>
            <div className='form__inner-headline'>
              <legend className='form__legend'>{t('File {idx}', {idx: i + 1})}</legend>
            </div>
            <div className='form__inner-actions'>
              <button type='button' className='fia-trash' title='Delete file' onClick={this.removeUploadedFile.bind(this, fileField.id)}><span>Delete</span></button>
            </div>
          </div>

          <div className='form__hascol form__hascol--2 disabled'>
            <div className='form__group'>
              <input type='text' id={`file-${fileField.id}`} name={`file-${fileField.id}`} className='form__control' placeholder={fileField.name} />
            </div>
            <div className='form__group'>
              <input type='text' id={`type-${fileField.id}`} name={`type-${fileField.id}`} className='form__control' placeholder={fileField.subtype} />
            </div>
          </div>
        </fieldset>
      );
    }

    let newFields = all.filter(o => !o.created_at).length;
    let limit = subtypeLimit(fileField.subtype.length);

    return (
      <fieldset className='form__fieldset' key={fileField.id}>
        <div className='form__inner-header'>
          <div className='form__inner-headline'>
            <legend className='form__legend'>{t('File')}</legend>
          </div>
          <div className='form__inner-actions'>
            <button
              type='button'
              className={c('fia-trash', {disabled: newFields <= 1})}
              title='Delete fieldset'
              onClick={this.removePoiFileField.bind(this, fileField.id)}>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className='form__hascol form__hascol--2'>
          <div className='form__group'>
            <input
              type='file'
              id={`poi-file-${fileField.id}`}
              name={`poi-file-${fileField.id}`}
              className='form__control'
              placeholder={t('Select a poi file')}
              onChange={this.onFileSelected.bind(this, fileField.id)}
            />
            {fileField.file !== null
              ? <p className='form__help'>{Math.round(fileField.uploaded / (1024 * 1024))}MB / {Math.round(fileField.size / (1024 * 1024))}MB</p>
              : null
            }
          </div>
          <div className='form__group'>
            <input
              type='text'
              id={`poi-type-${fileField.id}`}
              name={`poi-type-${fileField.id}`}
              className={limit.c('form__control')}
              placeholder={t('Type of the poi')}
              value={fileField.subtype}
              onChange={this.onSubtypeChange.bind(this, fileField.id)}
            />
            <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>
          </div>
        </div>
      </fieldset>
    );
  }

  renderSourceFile () {
    return (
      <div className='inner'>
        {this.state.fileFields.map(this.renderFileFieldset.bind(this))}

        <div className='form__extra-actions'>
          <button type='button' className='fea-plus' title='Add new file' onClick={this.addPoiFileField.bind(this)}><span>New file</span></button>
        </div>
      </div>
    );
  }

  renderBody () {
    return (
      <ModalBody>
        <form className='form' onSubmit={ e => { e.preventDefault(); this.allowSubmit() && this.onSubmit(); } }>
          <div className='form__group'>
            <label className='form__label'>Source</label>

            <label className='form__option form__option--inline form__option--custom-radio'>
              <input type='radio' name='source-type' id='file' checked={this.state.source === 'file'} />
              <span className='form__option__text'>File upload</span>
              <span className='form__option__ui'></span>
            </label>

            <label className='form__option form__option--inline form__option--custom-radio disabled'>
              <input type='radio' name='source-type' id='osm' checked={this.state.source === 'osm'} />
              <span className='form__option__text'>OSM data</span>
              <span className='form__option__ui'></span>
            </label>
          </div>
          {this.state.source === 'file' ? this.renderSourceFile() : null}
        </form>
      </ModalBody>
    );
  }
}

ModalPoi.propTypes = {
  sourceData: T.object,
  projectId: T.number,
  scenarioId: T.number,
  _showAlert: T.func,
  _showGlobalLoading: T.func,
  _hideGlobalLoading: T.func
};

export default ModalPoi;
