'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { t, getLanguage } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';
import { Textarea, TextInput } from '../limited-fields';

const ScenarioCreateModal = React.createClass({
  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioForm: T.object,
    scenarioList: T.array,
    projectId: T.string,

    saveScenario: T.func,
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
        !nextProps.scenarioForm.processing &&
        !nextProps.scenarioForm.error) {
      //
      let scenarioData = nextProps.scenarioForm.data;
      if (this.state.data.roadNetworkSource === 'new') {
        // Upload file
        this.setState({loading: true});
        this.uploadScenarioFile(scenarioData.roadNetworkUpload.presignedUrl);
      } else {
        this.props._showAlert('success', <p>{t('Scenario successfully created')}</p>, true, 4500);
        hashHistory.push(`${getLanguage()}/projects/${scenarioData.project_id}/scenarios/${scenarioData.id}`);
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

  onFileSelected: function (event) {
    // Store file reference
    const file = event.target.files[0];
    let roadNetworkSourceFile = {
      file,
      size: file.size,
      uploaded: 0
    };

    let data = Object.assign({}, this.state.data, {roadNetworkSourceFile});
    this.setState({data});
  },

  onFileUploadComplete: function () {
    this.setState({loading: false});
    let scenarioData = this.props.scenarioForm.data;
    hashHistory.push(`${getLanguage()}/projects/${scenarioData.project_id}/scenarios/${scenarioData.id}`);
  },

  uploadScenarioFile: function (presignedUrl) {
    this.xhr = new window.XMLHttpRequest();
    let file = this.state.data.roadNetworkSourceFile.file;

    this.xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        // I know what I'm doing here.
        let data = this.state.data;
        data.roadNetworkSourceFile.uploaded = evt.loaded;
        this.setState({data});
      }
    }, false);

    this.xhr.onreadystatechange = e => {
      if (this.xhr.readyState === XMLHttpRequest.DONE) {
        this.setState(this.getInitialState());
        this.onFileUploadComplete();
      }
    };

    // start upload
    this.xhr.open('PUT', presignedUrl, true);
    this.xhr.send(file);
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

  onSubmit: function (e) {
    e.preventDefault && e.preventDefault();

    if (this.checkErrors()) {
      var payload = {
        name: this.state.data.name,
        description: this.state.data.description || null
      };
      // On create we only want to send properties that were filled in.
      payload = _.pickBy(payload, v => v !== null);

      if (this.state.data.roadNetworkSource === 'clone') {
        this.props._showGlobalLoading();
        payload.roadNetworkSource = 'clone';
        payload.roadNetworkSourceScenario = this.state.data.roadNetworkSourceScenario;
      } else if (this.state.data.roadNetworkSource === 'new') {
        payload.roadNetworkSource = 'new';
      }
      this.props.saveScenario(this.props.projectId, payload);
    }
  },

  onFieldChange: function (field, e) {
    let data = Object.assign({}, this.state.data, {[field]: e.target.value});
    this.setState({data});
  },

  renderError: function () {
    let error = this.props.scenarioForm.error;

    if (!error) {
      return;
    }

    if (error.statusCode === 409) {
      return <p>The name is already in use.</p>;
    } else {
      return <p>{error.message || error.error}</p>;
    }
  },

  renderNameField: function () {
    let charLimit = 100;
    let l = this.state.data.name.length;
    let cl = c('form__help', {
      'form__limit--near': l >= charLimit - 20,
      'form__limit--reached': l >= charLimit
    });

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='scenario-name'>{t('Scenario name')}</label>
        <TextInput
          id='scenario-name'
          name='scenario-name'
          className='form__control form__control--medium'
          placeholder={t('Untitled scenario')}
          value={this.state.data.name}
          onChange={this.onFieldChange.bind(null, 'name')}
          limit={charLimit}
        />

        {this.state.errors.name ? <p className='form__error'>{t('A scenario name is required.')}</p> : null }

        <p className={cl}>{l}/{charLimit}</p>
      </div>
    );
  },

  renderDescriptionField: function () {
    let charLimit = 140;
    let l = this.state.data.description.length;
    let cl = c('form__help', {
      'form__limit--near': l >= charLimit - 20,
      'form__limit--reached': l >= charLimit
    });

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='scenario-desc'>{t('Description')} <small>({t('optional')})</small></label>
        <Textarea
          id='scenario-desc' rows='2'
          className='form__control'
          placeholder={t('Say something about this scenario')}
          value={this.state.data.description}
          onChange={this.onFieldChange.bind(null, 'description')}
          limit={charLimit}
        />
        <p className={cl}>{l}/{charLimit}</p>
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

          {this.renderError()}

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
            <div className='form__group form__group--attached'>
              <label className='form__label visually-hidden' htmlFor='road-network-new-file'>{t('New road network')}</label>
              <input type='file' name='road-network-new-file' id='road-network-new-file' className='form__control--upload' ref='file' onChange={this.onFileSelected} />
              {this.state.errors.roadNetworkSource ? <p className='form__error'>{t('A file is required.')}</p> : null }
              {this.state.data.roadNetworkSourceFile.file !== null
              ? <p className='form__help'>{Math.round(this.state.data.roadNetworkSourceFile.uploaded / (1024 * 1024))}MB / {Math.round(this.state.data.roadNetworkSourceFile.size / (1024 * 1024))}MB</p>
              : null
             }
            </div>
            ) : null}

          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className={c('mfa-tick', {'disabled': processing})} type='submit' onClick={this.onSubmit}><span>{t('Create')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioCreateModal;
