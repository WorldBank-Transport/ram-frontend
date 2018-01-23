'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';
import c from 'classnames';

import config from '../../../config';
import { limitHelper, getPropInsensitive } from '../../../utils/utils';
import { t } from '../../../utils/i18n';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';
import { FileInput, FileDisplay } from '../../file-input';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';

var labelLimit = limitHelper(20);

class ModalOrigins extends ModalBase {
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
      fileField.indicators = fileField.data.indicators;
      fileField.availableInd = fileField.data.availableInd;
    } else {
      fileField = this.getBaseFileField();
    }

    this.state = {
      fileField,
      fileToRemove: null
    };
  }

  getBaseFileField () {
    return {
      file: null,
      size: 0,
      uploaded: 0,
      indicators: [{
        key: '',
        label: ''
      }],
      availableInd: []
    };
  }

  onFileSelected (id, file, event) {
    this.setState({ fileField: this.getBaseFileField() });
    let fileField = this.getBaseFileField();

    // Store file reference.
    fileField.file = file;
    fileField.size = file.size;
    fileField.uploaded = 0;

    showGlobalLoading();

    // File contents.
    readFileAsJSON(file)
      .then(res => {
        let totalFeats = res.features.length;
        let noNameFeats = res.features.reduce((acc, v) => acc + (v.properties[getPropInsensitive(v.properties, 'name')] ? 0 : 1), 0);

        if (noNameFeats) {
          let msg = t('{noNameOrigins} out of {totalOrigins} origins don\'t have a name. "N/A" will be used.', {
            noNameOrigins: noNameFeats,
            totalOrigins: totalFeats
          });
          this.props._showAlert('warning', <p>{msg}</p>, true);
        }

        // Get the indicator common to every feature. Number indicators only.
        let indicators = res.features.map(o => {
          let numberKeys = [];
          Object.keys(o.properties).forEach(k => {
            if (!isNaN(parseInt(o.properties[k]))) {
              numberKeys.push(k);
            }
          });
          return numberKeys;
        });
        let intersect = indicators.shift();
        indicators.every(o => {
          intersect = intersect.filter(i => o.indexOf(i) !== -1);
          return !!intersect.length;
        });
        indicators = intersect;

        if (!indicators.length) {
          throw new Error(t('Invalid file selected: There are no available fields that could be used as population estimate'));
        }

        // Select the first available indicator.
        fileField.indicators = [{ key: indicators[0], label: '' }];
        // Store all the available indicators.
        fileField.availableInd = indicators;

        hideGlobalLoading();
        this.setState({ fileField });
      })
      .catch(err => {
        hideGlobalLoading();
        let msg = err instanceof Error ? err.message : t('Invalid file selected: Not a valid GeoJSON file');

        return this.props._showAlert('danger', <p>{msg}</p>, true);
      });
  }

  onFileRemove (id, event) {
    this.setState({
      fileField: this.getBaseFileField(),
      fileToRemove: id
    });
  }

  onIndicatorRemove (idx) {
    let fileField = _.cloneDeep(this.state.fileField);
    fileField.indicators.splice(idx, 1);
    this.setState({ fileField });
  }

  onIndicatorKeySelect (idx, event) {
    let fileField = _.cloneDeep(this.state.fileField);
    fileField.indicators[idx].key = event.target.value;
    this.setState({ fileField });
  }

  onIndicatorLabelChange (idx, event) {
    let fileField = _.cloneDeep(this.state.fileField);
    fileField.indicators[idx].label = event.target.value;
    this.setState({ fileField });
  }

  addIndicatorField () {
    let fileField = _.clone(this.state.fileField);
    fileField.indicators = fileField.indicators.concat({
      key: this.state.fileField.availableInd[0],
      label: ''
    });

    this.setState({ fileField });
  }

  allowSubmit () {
    if (this.state.fileToRemove && !this.state.fileField.file) {
      return true;
    }
    // Are all attributes valid?
    let validAttr = this.state.fileField.indicators.every(o => o.key !== '' && o.label !== '');
    // Are all lengths valid?
    let validLength = this.state.fileField.indicators.every(o => labelLimit(o.label.length).isOk());
    // Check for doubles.
    let doubles = _(this.state.fileField.indicators)
      .groupBy('key')
      .values()
      .some(o => o.length > 1);

    return validAttr && validLength && !doubles;
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
    if (this.state.fileField.file || this.state.fileField.created_at) {
      newFilesPromiseFn = () => {
        let formData = new FormData();
        formData.append('source-type', 'file');
        formData.append('source-name', 'origins');

        this.state.fileField.availableInd.forEach(o => {
          formData.append('available-ind', o);
        });

        // Submit keys and labels as arrays. The order is guaranteed.
        this.state.fileField.indicators.forEach(o => {
          formData.append('indicators[key]', o.key);
          formData.append('indicators[label]', o.label);
        });

        if (this.state.fileField.file) {
          formData.append('file', this.state.fileField.file);
        }

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
            fileField.indicators = res.data.indicators;
            fileField.availableInd = res.data.availableInd;
            this.setState({fileField});
          })
          .catch(err => {
            let msg = t('An error occurred while uploading a population file: {message}', {
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
        this.props._showAlert('success', <p>{t('Origins source successfully saved')}</p>, true, 4500);
        this.props.onCloseClick(true);
      })
      .catch(e => {
        hideGlobalLoading();
      });
  }

  renderIndicators () {
    let { fileField } = this.state;

    return fileField.indicators.map((o, i) => {
      let limit = labelLimit(o.label.length);
      return (
        <fieldset className={c('form__fieldset', {disabled: fileField.file === null})} key={`${o.key}-${i}`}>
          <div className='form__inner-header'>
            <div className='form__inner-headline'>
              <legend className='form__legend'>{t('Population estimate {idx}', {idx: i + 1})}</legend>
            </div>
            <div className='form__inner-actions'>
              <button type='button' className={c('fia-trash', {disabled: fileField.indicators.length <= 1})} title={t('Delete fieldset')} onClick={this.onIndicatorRemove.bind(this, i)}><span>{t('Delete')}</span></button>
            </div>
          </div>

          <div className='form__hascol form__hascol--2'>
            <div className='form__group'>
              <label className='form__label' htmlFor={`key-${i}`}>{t('Key')}</label>
              <select id={`key-${i}`} name={`key-${i}`} className='form__control' value={o.key} onChange={this.onIndicatorKeySelect.bind(this, i)}>
                {fileField.availableInd.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor={`label-${i}`}>{t('Label')}</label>
              <input type='text' id={`label-${i}`} name={`label-${i}`} className={limit.c('form__control')} value={o.label} onChange={this.onIndicatorLabelChange.bind(this, i)} />
              <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>
            </div>
          </div>
        </fieldset>
      );
    });
  }

  renderBody () {
    let { fileField } = this.state;
    let hasFile = !!fileField.created_at;

    return (
      <ModalBody>
        <form className='form' onSubmit={ e => { e.preventDefault(); this.allowSubmit() && this.onSubmit(); } }>
          {hasFile ? (
            <FileDisplay
              id='origins'
              name='origins'
              label={t('Source')}
              value={fileField.name}
              onRemoveClick={this.onFileRemove.bind(this, fileField.id)} />
          ) : (
            <FileInput
              id='origins'
              name='origins'
              label={t('Source')}
              value={fileField.file}
              placeholder={t('Choose a file')}
              onFileSelect={this.onFileSelected.bind(this, fileField.id)} >

              {fileField.file !== null
                ? <p className='form__help'>{Math.round(fileField.uploaded / (1024 * 1024))}MB / {Math.round(fileField.size / (1024 * 1024))}MB</p>
                : null
              }
            </FileInput>
          )}
          {this.renderIndicators()}
          <div className='form__extra-actions'>
            <button type='button' className={c('fea-plus', {disabled: fileField.file === null})} title={t('Add new population estimate')} onClick={this.addIndicatorField.bind(this)}><span>{t('New population estimate')}</span></button>
          </div>
        </form>
      </ModalBody>
    );
  }
}

ModalOrigins.propTypes = {
  sourceData: T.object,
  projectId: T.number,
  _showAlert: T.func
};

export default ModalOrigins;

function readFileAsJSON (file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onerror = err => reject(err);

    reader.onload = e => {
      try {
        let json = JSON.parse(e.target.result);
        return resolve(json);
      } catch (err) {
        return reject(err);
      }
    };

    reader.readAsText(file);
  });
}
