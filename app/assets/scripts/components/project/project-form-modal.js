'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { t, getLanguage } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';
import { Textarea, TextInput } from '../limited-fields';

const ProjectFormModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    projectForm: T.object,
    saveProject: T.func,
    resetForm: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,

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
    if (this.props.projectForm.processing && !nextProps.projectForm.processing) {
      this.props._hideGlobalLoading();
    }

    if (this.props.projectForm.action === 'edit' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing &&
        !nextProps.projectForm.error) {
      if (!this.props.editing) {
        hashHistory.push(`${getLanguage()}/projects/${nextProps.projectForm.data.id}/setup`);
      } else {
        this.onClose();
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

  renderError: function () {
    let error = this.props.projectForm.error;

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
        <label className='form__label' htmlFor='project-name'>{t('Project name')}</label>
        <TextInput
          id='project-name'
          name='project-name'
          className='form__control form__control--medium'
          placeholder={t('Untitled project')}
          value={this.state.data.name}
          onChange={this.onFieldChange.bind(null, 'name')}
          limit={charLimit}
        />

        {this.state.errors.name ? <p className='form__error'>{t('A project name is required.')}</p> : null }

        <p className={cl}>Keep it short and sweet. {l}/{charLimit}</p>
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
        <label className='form__label' htmlFor='project-desc'>{t('Description')} <small>({t('optional')})</small></label>
        <Textarea
          id='project-desc' rows='2'
          className='form__control'
          placeholder={t('Say something about this project')}
          value={this.state.data.description}
          onChange={this.onFieldChange.bind(null, 'description')}
          limit={charLimit}
        />
        <p className={cl}>{l}/{charLimit}</p>
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

          {processing ? <p>Processing...</p> : null}

          {this.renderError()}

          <form className={c('form', {'disable': processing})} onSubmit={this.onSubmit}>
            {this.renderNameField()}
            {this.renderDescriptionField()}
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className='mfa-tick' type='submit' onClick={this.onSubmit}><span>{this.props.editing ? t('Save') : t('Create')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ProjectFormModal;
