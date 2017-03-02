'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import { hashHistory } from 'react-router';

import { getLanguage } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const ProjectFormModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    projectForm: T.object,
    postProject: T.func
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
    if (this.props.projectForm.processing && !nextProps.projectForm.processing && !nextProps.projectForm.error) {
      hashHistory.push(`${getLanguage()}/projects/${nextProps.projectForm.data.id}/setup`);
    }
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

      // On create we only want to send properties that were filled in.
      payload = _.pickBy(payload, v => v !== null);
      this.props.postProject(payload);
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
        id='modal-showcase'
        className='modal--large'
        onCloseClick={this.props.onCloseClick}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>New Project</h1>
          </div>
        </ModalHeader>
        <ModalBody>

        {processing ? <p>Processing...</p> : null}

        {this.renderError()}

          <form className={c({'disable': processing})}>
            <div className='form__group'>
              <label className='form__label' htmlFor='project-name'>Project name*</label>
              <input type='text' className='form__control form__control--medium' id='project-name' name='project-name' placeholder='Project name' value={this.state.data.name} onChange={this.onFieldChange.bind(null, 'name')} />

                {this.state.errors.name ? <p className='form__error'>A name is required.</p> : null }

                <p className='form__help'>Keep it short and sweet.</p>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='project-desc'>Description</label>
              <textarea ref='description' className='form__control' id='project-desc' rows='4' placeholder='Say something about this project' value={this.state.data.description} onChange={this.onFieldChange.bind(null, 'description')}></textarea>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='button button--achromic' type='button' onClick={this.props.onCloseClick}><span>Cancel</span></button>
          <button className='button button--base' type='submit' onClick={this.onSubmit}><span>Save</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ProjectFormModal;
