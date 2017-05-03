'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { t, getLanguage } from '../../utils/i18n';
import { limitHelper } from '../../utils/utils';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

var nameLimit = limitHelper(80);
var descLimit = limitHelper(140);

const ProjectFormModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    projectForm: T.object,
    saveProject: T.func,
    resetForm: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,
    _showAlert: T.func,

    // Only available when editing.
    editing: T.bool,
    projectData: T.object
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

    if (this.props.projectForm.processing && !nextProps.projectForm.processing) {
      this.props._hideGlobalLoading();
    }

    if (this.props.projectForm.action === 'edit' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing) {
      //
      if (!nextProps.projectForm.error) {
        if (this.props.editing) {
          this.props._showAlert('success', <p>{t('Project successfully updated')}</p>, true, 4500);
          this.onClose();
        } else {
          this.props._showAlert('success', <p>{t('Project successfully created')}</p>, true, 4500);
          hashHistory.push(`${getLanguage()}/projects/${nextProps.projectForm.data.id}/setup`);
        }
      } else {
        this.props._showAlert('danger', <p>{nextProps.projectForm.error.message}</p>, true);
      }
      return;
    }

    if (!this.props.revealed && nextProps.revealed) {
      // Modal was revealed. Be sure the data is correct.
      this.setState({data: {
        name: _.get(nextProps.projectData, 'name', ''),
        description: _.get(nextProps.projectData, 'description', '') || ''
      }});
    }
  },

  componentWillUnmount: function () {
    this.props.resetForm();
  },

  onClose: function () {
    this.props.resetForm();
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

  allowSubmit: function () {
    if (this.props.projectForm.processing || this.state.loading) return false;

    if (this.state.data.name.length === 0 || !nameLimit(this.state.data.name.length).isOk()) return false;

    if (this.state.data.description.length > 0 && !descLimit(this.state.data.description.length).isOk()) return false;

    return true;
  },

  onSubmit: function (e) {
    e.preventDefault && e.preventDefault();

    if (this.checkErrors()) {
      var payload = {
        name: this.state.data.name,
        description: this.state.data.description || null
      };

      this.props._showGlobalLoading();

      if (this.props.editing) {
        this.props.saveProject(this.props.projectData.id, payload);
      } else {
        // On create we only want to send properties that were filled in.
        payload = _.pickBy(payload, v => v !== null);
        this.props.saveProject(payload);
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
        <label className='form__label' htmlFor='project-name'>{t('Project name')}</label>
        <input
          type='text'
          id='project-name'
          name='project-name'
          className={limit.c('form__control form__control--medium')}
          placeholder={t('Untitled project')}
          value={this.state.data.name}
          onChange={this.onFieldChange.bind(null, 'name')}
        />

        {this.state.errors.name ? <p className='form__error'>{t('A project name is required.')}</p> : null }

        <p className='form__help'>{limit.remaining} {t('characters left')}</p>
      </div>
    );
  },

  renderDescriptionField: function () {
    let limit = descLimit(this.state.data.description.length);

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='project-desc'>{t('Description')} <small>({t('optional')})</small></label>
        <textarea
          id='project-desc'
          rows='2'
          className={limit.c('form__control')}
          placeholder={t('Say something about this project')}
          value={this.state.data.description}
          onChange={this.onFieldChange.bind(null, 'description')}
        />
        <p className='form__help'>{limit.remaining} {t('characters left')}</p>
      </div>
    );
  },

  render: function () {
    let processing = this.props.projectForm.processing;

    return (
      <Modal
        id='modal-project-metadata'
        className='modal--small'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{this.props.editing ? t('Edit project metadata') : t('Create new project')}</h1>
            <div className='modal__description'>
              <p>{this.props.editing ? t('Edit the attributes of your project.') : t('Name and describe your new project.')}</p>
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
          <button className={c('mfa-tick', {'disabled': !this.allowSubmit()})} type='submit' onClick={this.onSubmit}><span>{this.props.editing ? t('Save') : t('Create')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ProjectFormModal;
