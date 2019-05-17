'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import config from '../../../config';
import { limitHelper, readFileAsJSON, coordExtract } from '../../../utils/utils';
import { t } from '../../../utils/i18n';
import { postFormdata, fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';
import { FileInput } from '../../file-input';
import { getPoiOsmTypes } from '../../../utils/constants';

import { ModalBody } from '../../modal';
import ModalBase from './modal-base';
import SourceSelector from './source-selector';
import { CatalogPoiSource } from './catalog-source';

const WBC_LABEL_LIMIT = 20;
var subtypeLimit = limitHelper(15);
var wbcLabelLimit = limitHelper(WBC_LABEL_LIMIT);

class ModalPoi extends ModalBase {
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
    let fileFields = [];
    // Only add the files if the source is file. This avoids the field being
    // filled with catalog files after a failed setup.
    if (props.sourceData.type === 'file') {
      fileFields = props.sourceData.files;
    }

    fileFields = fileFields.concat(this.getBasePoiFileField());
    const selectedPoiTypes = props.sourceData.osmOptions.osmPoiTypes || [];
    const catalogRes = _.get(props.sourceData, 'wbCatalogOptions.resources', []);

    this.state = {
      source: props.sourceData.type || 'file',
      selectedPoiTypes,
      fileFields,
      filesToRemove: [],
      wbCatalogOptions: catalogRes.length
        ? catalogRes
        : [{key: '', label: ''}]
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

  // @common All source modals.
  onSourceChange (event) {
    const source = event.target.value;
    this.setState({ source });
  }

  // @common All source modals.
  onWbCatalogOptSelect (options) {
    this.setState({ wbCatalogOptions: options });
  }

  onFileSelected (id, file, event) {
    let fileFields = _.clone(this.state.fileFields);
    const idx = _.findIndex(fileFields, ['id', id]);

    // Store file reference.
    fileFields[idx].file = file;
    fileFields[idx].size = file.size;
    fileFields[idx].uploaded = 0;

    showGlobalLoading();

    // File contents.
    readFileAsJSON(file)
      .then(res => {
        const isInvalid = res.features.some(feat => {
          const invalidLon = coordExtract(feat.geometry.coordinates, 'lon').some(coord => coord > 180 || coord < -180);
          const invalidLat = coordExtract(feat.geometry.coordinates, 'lat').some(coord => coord > 90 || coord < -90);
          return invalidLon || invalidLat;
        });

        hideGlobalLoading();

        if (isInvalid) {
          let msg = t('Invalid coordinates found on selected file. Ensure that the projection is EPSG:4326 (WGS84)');
          this.props._showAlert('danger', <p>{msg}</p>, true);
          return;
        }

        this.setState({ fileFields });
      })
      .catch(err => {
        hideGlobalLoading();
        let msg = err instanceof Error ? err.message : t('Invalid file selected: Not a valid GeoJSON file');

        return this.props._showAlert('danger', <p>{msg}</p>, true);
      });
  }

  onSubtypeChange (id, event) {
    let fileFields = _.clone(this.state.fileFields);
    const idx = _.findIndex(fileFields, ['id', id]);

    const subtype = event.target.value;
    fileFields[idx].subtype = subtype;

    this.setState({ fileFields });
  }

  selectOsmTypes (what) {
    if (what === 'none') {
      this.setState({ selectedPoiTypes: [] });
    } else if (what === 'all') {
      this.setState({ selectedPoiTypes: getPoiOsmTypes().map(o => o.key) });
    }
  }

  onOsmPoiChange (e) {
    let val = e.target.value;
    let types = this.state.selectedPoiTypes;
    let idx = types.indexOf(val);
    if (idx === -1) {
      types.push(val);
    } else {
      types.splice(idx, 1);
    }
    return this.setState({selectedPoiTypes: types});
  }

  allowSubmit () {
    if (this.state.source === 'osm') {
      return this.state.selectedPoiTypes.length > 0;
    } else if (this.state.source === 'file') {
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
    } else if (this.state.source === 'wbcatalog') {
      // Are all keys valid?
      let validAttr = this.state.wbCatalogOptions.every(o => o.key !== '' && o.label !== '');
      // Are all lengths valid?
      let validLength = this.state.wbCatalogOptions.every(o => wbcLabelLimit(o.label.length).isOk());
      // Check for doubles.
      let doubles = _(this.state.wbCatalogOptions)
        .groupBy('key')
        .values()
        .some(o => o.length > 1);

      return validAttr && validLength && !doubles;
    }

    return false;
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
          let msg = t('An error occurred while deleting file {filename}: {message}', {
            filename: f.name,
            message: err.message
          });
          this.props._showAlert('danger', <p>{msg}</p>, true);
          // Rethrow to stop chain.
          throw err;
        });
    });

    // Data to submit.
    let newFilesPromiseFn;
    if (this.state.source === 'file') {
      newFilesPromiseFn = this.state.fileFields.filter(o => !o.created_at && o.file).map(o => () => {
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
            let msg = t('An error occurred while uploading file {type}: {message}', {
              type: o.subtype,
              message: err.message
            });
            this.props._showAlert('danger', <p>{msg}</p>, true);
            // Rethrow to stop chain.
            throw err;
          });
      });
    } else if (this.state.source === 'osm' || this.state.source === 'wbcatalog') {
      let formData = new FormData();
      formData.append('source-type', this.state.source);
      formData.append('source-name', 'poi');
      if (this.state.source === 'osm') {
        this.state.selectedPoiTypes.forEach(o => {
          formData.append('osmPoiTypes', o);
        });
      }
      if (this.state.source === 'wbcatalog') {
        // Submit keys and labels as arrays. The order is guaranteed.
        this.state.wbCatalogOptions.forEach(o => {
          formData.append('wbcatalog-options[key]', o.key);
          formData.append('wbcatalog-options[label]', o.label);
        });
      }

      let { promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios/${this.props.scenarioId}/source-data`, formData, () => {});
      // this.xhr = xhr;
      newFilesPromiseFn = () => promise
        .catch(err => {
          let msg = t('An error occurred while saving the point of interest source: {message}', {
            message: err.message
          });
          this.props._showAlert('danger', <p>{msg}</p>, true);
          // Rethrow to stop chain.
          throw err;
        });
    }

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
              <button type='button' className='fia-trash' title={t('Delete file')} onClick={this.removeUploadedFile.bind(this, fileField.id)}><span>{t('Delete')}</span></button>
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
              title={t('Delete fieldset')}
              onClick={this.removePoiFileField.bind(this, fileField.id)}
              disabled={newFields <= 1}>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className='form__hascol form__hascol--2'>
          <FileInput
            id={`poi-file-${fileField.id}`}
            name={`poi-file-${fileField.id}`}
            value={fileField.file}
            label={t('Source')}
            hideLabel
            placeholder={t('Choose a file')}
            onFileSelect={this.onFileSelected.bind(this, fileField.id)} >

            {fileField.file !== null
              ? <p className='form__help'>{Math.round(fileField.uploaded / (1024 * 1024))}MB / {Math.round(fileField.size / (1024 * 1024))}MB</p>
              : null
            }
          </FileInput>
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
          <button type='button' className='fea-plus' title={t('Add new file')} onClick={this.addPoiFileField.bind(this)}><span>{t('New file')}</span></button>
        </div>
      </div>
    );
  }

  renderSourceCatalog () {
    return (
      <CatalogPoiSource
        selectedOptions={this.state.wbCatalogOptions}
        labelLimitSize={WBC_LABEL_LIMIT}
        onChange={this.onWbCatalogOptSelect} />
    );
  }

  renderSourceOsm () {
    return (
      <div className='form__group'>
        <div className='form__inner-header'>
          <div className='form__inner-headline'>
            <label className='form__label' htmlFor='inputText4'>{t('Types to import')}</label>
          </div>
          <div className='form__inner-actions'>
            <dl className='form__options-menu'>
              <dt>{t('Select')}</dt>
              <dd><button type='button' className='fia-global' title={t('Select all')} onClick={this.selectOsmTypes.bind(this, 'all')}><span>{t('All')}</span></button></dd>
              <dd><button type='button' className='fia-global' title={t('Deselect none')} onClick={this.selectOsmTypes.bind(this, 'none')}><span>{t('None')}</span></button></dd>
            </dl>
          </div>
        </div>

        <div className='form__hascol form__hascol--3'>
          {getPoiOsmTypes().map(o => (
            <label key={o.key} className='form__option form__option--custom-checkbox' title={o.value}>
              <input type='checkbox' name={o.key} value={o.key} onChange={this.onOsmPoiChange.bind(this)} checked={this.state.selectedPoiTypes.indexOf(o.key) !== -1} />
              <span className='form__option__ui'></span>
              <span className='form__option__text'>{o.value}</span>
            </label>
          ))}
        </div>

        <div className='form__note'><p>{t('Import POI data from OpenStreetMap. See the documentation for an overview of the tags that are included in each POI type.')}</p></div>

      </div>
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
          {this.state.source === 'osm' ? this.renderSourceOsm() : null}
          {this.state.source === 'wbcatalog' ? this.renderSourceCatalog() : null}
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
