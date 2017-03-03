'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { t, getLanguage } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const ProjectFormModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    projectForm: T.object,
    saveProject: T.func,

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

          <form className={c({'disable': processing})}>
            <div className='form__group'>
              <label className='form__label' htmlFor='project-name'>{t('Project name')}</label>
              <input type='text' className='form__control form__control--medium' id='project-name' name='project-name' placeholder={t('Untitled project')} value={this.state.data.name} onChange={this.onFieldChange.bind(null, 'name')} />

              {this.state.errors.name ? <p className='form__error'>{t('A project name is required.')}</p> : null }

              <p className='form__help'>Keep it short and sweet.</p>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='project-desc'>{t('Description')} <small>({t('optional')})</small></label>
              <textarea ref='description' className='form__control' id='project-desc' rows='2' placeholder={t('Say something about this project')} value={this.state.data.description} onChange={this.onFieldChange.bind(null, 'description')}></textarea>
            </div>
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
