'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import { t } from '../../utils/i18n';
import { limitHelper } from '../../utils/utils';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

var nameLimit = limitHelper(80);
var descLimit = limitHelper(140);

const ScenarioEditModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioForm: T.object,
    finishingSetup: T.bool,
    scenarioData: T.object,

    saveScenario: T.func,
    resetForm: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,
    _showAlert: T.func
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
    if (!this.props.revealed && !nextProps.revealed) {
      // If the modal is not, nor is going to be revealed, do nothing.
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
        if (this.props.finishingSetup) {
          this.onClose({scenarioSubmitted: true});
        } else {
          this.props._showAlert('success', <p>{t('Scenario successfully updated')}</p>, true, 4500);
          this.onClose();
        }
      } else {
        this.props._showAlert('danger', <p>{nextProps.scenarioForm.error.message}</p>, true);
      }
      return;
    }

    if (!this.props.revealed && nextProps.revealed && !this.props.finishingSetup) {
      this.props.resetForm();
      // Modal was revealed. Be sure the data is correct.
      this.setState({data: {
        name: _.get(nextProps.scenarioData, 'name', ''),
        description: _.get(nextProps.scenarioData, 'description', '') || ''
      }});
    }
  },

  componentWillUnmount: function () {
    this.props.resetForm();
  },

  onClose: function (data) {
    this.props.resetForm();
    this.setState(this.getInitialState());
    this.props.onCloseClick(data);
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

  allowSubmit: function () {
    if (this.props.scenarioForm.processing || this.state.loading) return false;

    if (this.state.data.name.length === 0 || !nameLimit(this.state.data.name.length).isOk()) return false;

    if (this.state.data.description.length > 0 && !descLimit(this.state.data.description.length).isOk()) return false;

    return true;
  },

  onSubmit: function (e) {
    e.preventDefault && e.preventDefault();

    if (this.checkErrors()) {
      var payload = {};

      this.props._showGlobalLoading();

      if (this.props.finishingSetup) {
        payload = {
          scenarioName: this.state.data.name
        };
        if (this.state.data.description) {
          payload.scenarioDescription = this.state.data.description;
        }

        return this.props.saveScenario(this.props.scenarioData.project_id, payload);
      } else {
        payload = {
          name: this.state.data.name,
          description: this.state.data.description || null
        };

        return this.props.saveScenario(this.props.scenarioData.project_id, this.props.scenarioData.id, payload);
      }
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
          autoFocus
          onChange={this.onFieldChange.bind(null, 'name')}
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
    let processing = this.props.scenarioForm.processing;

    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--small'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{this.props.finishingSetup ? t('Finish project setup') : t('Edit scenario metadata')}</h1>
            <div className='modal__description'>
              <p>{this.props.finishingSetup ? t('Finish the project setup by creating the first scenario') : t('Edit the attributes of your scenario.')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <form className={c('form', {'disable': processing})} onSubmit={this.onSubmit}>
            {this.renderNameField()}
            {this.renderDescriptionField()}
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className={c('mfa-tick', {'disabled': !this.allowSubmit()})} type='submit' onClick={this.onSubmit} disabled={!this.allowSubmit()}><span>{this.props.finishingSetup ? t('Create scenario') : t('Save')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioEditModal;
