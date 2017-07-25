'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';
import ReactTooltip from 'react-tooltip';

import config from '../../config';
import { t, getLanguage } from '../../utils/i18n';
import { rnEditThreshold, rnEditThresholdDisplay } from '../../utils/constants';
import { limitHelper } from '../../utils/utils';
import { postFormdata } from '../../actions';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';
import { FileInput } from '../file-input';

var nameLimit = limitHelper(80);
var descLimit = limitHelper(140);

const ScenarioCreateModal = React.createClass({
  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioForm: T.object,
    scenarioList: T.array,
    projectId: T.string,

    startSubmitScenario: T.func,
    finishSubmitScenario: T.func,
    resetForm: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,
    _showAlert: T.func
  },

  getInitialState: function () {
    return {
      errors: {
        name: null,
        roadNetworkSource: null
      },
      data: {
        name: '',
        description: '',
        roadNetworkSource: 'clone',
        roadNetworkSourceScenario: this.props.scenarioList[0].id,
        roadNetworkSourceFile: {
          file: null,
          size: 0,
          uploaded: 0
        }
      },
      loading: false
    };
  },

  xhr: null,

  componentWillReceiveProps: function (nextProps) {
    if (!this.props.revealed) {
      // If it's not revealed don't do anything.
      return;
    }

    if (this.props.scenarioForm.processing && !nextProps.scenarioForm.processing) {
      this.props._hideGlobalLoading();
    }

    if (this.props.scenarioForm.action === 'edit' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
    //
      if (!nextProps.scenarioForm.error) {
        let scenarioData = nextProps.scenarioForm.data;
        this.props._showAlert('success', <p>{t('Scenario successfully created')}</p>, true, 4500);
        hashHistory.push(`${getLanguage()}/projects/${scenarioData.project_id}/scenarios/${scenarioData.id}`);
      } else {
        this.props._showAlert('danger', <p>{nextProps.scenarioForm.error.message}</p>, true);
      }
    }
  },

  componentWillUnmount: function () {
    this.props.resetForm();
    if (this.xhr) {
      this.xhr.abort();
    }
  },

  onClose: function () {
    if (this.xhr) {
      this.xhr.abort();
    }
    this.props.resetForm();
    this.setState(this.getInitialState());
    this.props.onCloseClick();
  },

  onFileSelected: function (file) {
    // Store file reference.
    let roadNetworkSourceFile = {
      file,
      size: file.size,
      uploaded: 0
    };

    let data = Object.assign({}, this.state.data, {roadNetworkSourceFile});
    this.setState({data});

    if (file.size >= rnEditThreshold) {
      this.props._showAlert('warning', <p>File size is above {rnEditThresholdDisplay}. Road network editing will be disabled.</p>, true);
    }
  },

  checkErrors: function () {
    let control = true;
    let errors = this.getInitialState().errors;

    if (this.state.data.name === '') {
      errors.name = true;
      control = false;
    }

    if (this.state.data.roadNetworkSource === 'new' && !this.state.data.roadNetworkSourceFile.file) {
      errors.roadNetworkSource = true;
      control = false;
    }

    this.setState({errors});
    return control;
  },

  allowSubmit: function () {
    if (this.props.scenarioForm.processing || this.state.loading) return false;

    if (this.state.data.name.length === 0 || !nameLimit(this.state.data.name.length).isOk()) return false;

    if (this.state.data.description.length > 0 && !descLimit(this.state.data.description.length).isOk()) return false;

    if (this.state.data.roadNetworkSource === 'new' && !this.state.data.roadNetworkSourceFile.file) return false;

    return true;
  },

  onSubmit: function (e) {
    e.preventDefault && e.preventDefault();

    if (this.checkErrors() && !this.xhr) {
      this.props._showGlobalLoading();

      let {
        name,
        description,
        roadNetworkSource,
        roadNetworkSourceScenario,
        roadNetworkSourceFile
      } = this.state.data;

      let formData = new FormData();
      formData.append('name', name);
      formData.append('roadNetworkSource', roadNetworkSource);

      if (description) {
        formData.append('description', description);
      }

      switch (roadNetworkSource) {
        case 'new':
          formData.append('roadNetworkFile', roadNetworkSourceFile.file);
          break;
        case 'clone':
          formData.append('roadNetworkSourceScenario', roadNetworkSourceScenario);
          break;
      }

      let onProgress = progress => {
        let data = _.cloneDeep(this.state.data);
        data.roadNetworkSourceFile.uploaded = progress;
        this.setState({data});
      };

      this.props.startSubmitScenario();

      let { xhr, promise } = postFormdata(`${config.api}/projects/${this.props.projectId}/scenarios`, formData, onProgress);
      this.xhr = xhr;

      promise
        .then(result => {
          this.xhr = null;
          console.log('re', result);
          this.props.finishSubmitScenario(result);
        })
        .catch(err => {
          this.xhr = null;
          console.log('err', err);
          this.props.finishSubmitScenario(null, err);
        });
    }
  },

  onFieldChange: function (field, e) {
    let data = Object.assign({}, this.state.data, {[field]: e.target.value});
    this.setState({data});
  },

  renderNameField: function () {
    let limit = nameLimit(this.state.data.name.length);

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='scenario-name'>{t('Name')}</label>
        <input
          type='text'
          id='scenario-name'
          name='scenario-name'
          className={limit.c('form__control form__control--medium')}
          placeholder={t('Untitled scenario')}
          value={this.state.data.name}
          onChange={this.onFieldChange.bind(null, 'name')}
          autoFocus
        />

        {this.state.errors.name ? <p className='form__error'>{t('A scenario name is required.')}</p> : null }

        <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>
      </div>
    );
  },

  renderDescriptionField: function () {
    let limit = descLimit(this.state.data.description.length);

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='scenario-desc'>{t('Description')} <small>({t('optional')})</small></label>
        <textarea
          id='scenario-desc'
          rows='2'
          className={limit.c('form__control')}
          placeholder={t('Say something about this scenario')}
          value={this.state.data.description}
          onChange={this.onFieldChange.bind(null, 'description')}
        />
        <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>
      </div>
    );
  },

  render: function () {
    let processing = this.props.scenarioForm.processing || this.state.loading;

    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--small'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Create new scenario')}</h1>
            <div className='modal__description'>
              <p>{t('Name and describe your new scenario.')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <form className={c('form', {'disabled': processing})} onSubmit={this.onSubmit}>
            {this.renderNameField()}
            {this.renderDescriptionField()}

            <div className='form__group'>
              <label className='form__label'>Road network</label>

              <label className='form__option form__option--inline form__option--custom-radio'>
                <input type='radio' name='road-network' id='road-network-clone' value='clone' onChange={this.onFieldChange.bind(null, 'roadNetworkSource')} checked={this.state.data.roadNetworkSource === 'clone'}/>
                <span className='form__option__text'>{t('Clone from scenario')}</span>
                <span className='form__option__ui'></span>
              </label>
              <label className='form__option form__option--inline form__option--custom-radio'>
                <input type='radio' name='road-network' id='road-network-new' value='new' onChange={this.onFieldChange.bind(null, 'roadNetworkSource')} checked={this.state.data.roadNetworkSource === 'new'}/>
                <span className='form__option__text'>{t('Upload new')}</span>
                <span className='form__option__ui'></span>
              </label>
              <label data-tip={t('Coming soon')} data-effect='solid' className='form__option form__option--inline form__option--custom-radio visually-disabled'>
                <input type='radio' name='road-network' id='road-network-osm' value='osm' onChange={this.onFieldChange.bind(null, 'roadNetworkSource')} checked={this.state.data.roadNetworkSource === 'osm'} disabled />
                <span className='form__option__text'>{t('OSM data')}</span>
                <span className='form__option__ui'></span>
              </label>
            </div>

            {this.state.data.roadNetworkSource === 'clone' ? (
            <div className='form__group form__group--attached'>
              <label className='form__label visually-hidden' htmlFor='road-network-clone-options'>{t('Clone from scenario')}</label>
              <select name='road-network-clone-options' id='road-network-clone-options' className='form__control' value={this.state.data.roadNetworkSourceScenario} onChange={this.onFieldChange.bind(null, 'roadNetworkSourceScenario')}>
                {this.props.scenarioList.map(scenario => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
              </select>
            </div>
            ) : null}

            {this.state.data.roadNetworkSource === 'new' ? (
            <FileInput
              wrapperClass='form__group form__group--attached'
              id='road-network-new-file'
              name='road-network-new-file'
              label={'New road network'}
              hideLabel
              value={this.state.data.roadNetworkSourceFile.file}
              placeholder={t('Choose a file')}
              onFileSelect={this.onFileSelected} >

              {this.state.data.roadNetworkSourceFile.file !== null
                ? <p className='form__help'>{Math.round(this.state.data.roadNetworkSourceFile.uploaded / (1024 * 1024))}MB / {Math.round(this.state.data.roadNetworkSourceFile.size / (1024 * 1024))}MB</p>
                : null
              }
            </FileInput>
            ) : null}

            {this.state.data.roadNetworkSource === 'osm' && <p>{t('Import road network data from OpenStreetMap.')}</p>}
            {this.state.data.roadNetworkSource === 'osm' && <p>{t('When the resulting import is over {max} the road network editing will be disabled.', {max: rnEditThresholdDisplay})}</p>}

            <ReactTooltip />
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className={c('mfa-tick', {'disabled': !this.allowSubmit()})} type='submit' onClick={this.onSubmit}><span>{t('Create')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioCreateModal;
