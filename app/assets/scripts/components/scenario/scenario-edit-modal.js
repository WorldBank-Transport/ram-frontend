'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { t, getLanguage } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const ScenarioEditModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioForm: T.object,
    ghostScenario: T.bool,
    scenarioData: T.object,

    saveScenario: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func
  },

  getInitialState: function () {
    return {
      errors: {
        name: null
      },
      data: {
        name: '',
        description: ''
      }
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.scenarioForm.processing && !nextProps.scenarioForm.processing) {
      this.props._hideGlobalLoading();
    }

    // if (this.props.scenarioForm.action === 'edit' &&
    //     this.props.scenarioForm.processing &&
    //     !nextProps.scenarioForm.processing &&
    //     !nextProps.scenarioForm.error) {
    //   if (this.props.ghostScenario) {
    //     hashHistory.push(`${getLanguage()}/projects/${nextProps.scenarioData.project_id}/scenarios/${nextProps.scenarioData.id}`);
    //   } else {
    //     this.onClose();
    //   }
    //   return;
    // }

    // if (!this.props.revealed && nextProps.revealed && !this.props.ghostScenario) {
    //   // Modal was revealed. Be sure the data is correct.
    //   this.setState({data: {
    //     name: _.get(nextProps.scenarioData, 'name', ''),
    //     description: _.get(nextProps.scenarioData, 'description', '') || ''
    //   }});
    // }
  },

  onClose: function () {
    this.setState(this.getInitialState());
    this.props.onCloseClick();
  },

  checkErrors: function () {
    let control = true;
    let errors = this.getInitialState().errors;

    if (this.state.data.name === '') {
      errors.name = true;
      control = false;
    }

    this.setState({errors});
    return control;
  },

  onSubmit: function () {
    if (this.checkErrors()) {
      var payload = {
        name: this.state.data.name,
        description: this.state.data.description || null
      };

      this.props._showGlobalLoading();

      // this.props.saveScenario(this.props.projectData.id, payload);
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

  render: function () {
    let processing = this.props.scenarioForm.processing;

    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--small'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{this.props.ghostScenario ? t('Create new scenario') : t('Edit scenario metadata')}</h1>
            <div className='modal__description'>
              <p>{this.props.ghostScenario ? t('Name and describe your new scenario.') : t('Edit the attributes of your scenario.')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>

          {processing ? <p>Processing...</p> : null}

          {this.renderError()}

          <form className={c({'disable': processing})}>
            <div className='form__group'>
              <label className='form__label' htmlFor='scenario-name'>{t('Scenario name')}</label>
              <input type='text' className='form__control form__control--medium' id='scenario-name' name='scenario-name' placeholder={t('Untitled scenario')} value={this.state.data.name} onChange={this.onFieldChange.bind(null, 'name')} />

              {this.state.errors.name ? <p className='form__error'>{t('A Scenario name is required.')}</p> : null }

              <p className='form__help'>Keep it short and sweet.</p>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='scenario-desc'>{t('Description')} <small>({t('optional')})</small></label>
              <textarea ref='description' className='form__control' id='scenario-desc' rows='2' placeholder={t('Say something about this scenario')} value={this.state.data.description} onChange={this.onFieldChange.bind(null, 'description')}></textarea>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className='mfa-tick' type='submit' onClick={this.onSubmit}><span>{this.props.ghostScenario ? t('Create') : t('Save')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioEditModal;
