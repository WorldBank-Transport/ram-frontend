'use strict';
import React from 'react';

import { t } from '../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from './modal';

const noop = () => {};
// Once the component is mounted we store it to be able to access it from
// the outside.
var theConfirmationModal = null;

const ConfirmationPrompt = React.createClass({
  getInitialState: function () {
    return {
      onConfirm: noop,
      onCancel: noop,
      revealed: false,
      title: t('Confirm'),
      description: null,
      body: <p>{t('Are you sure')}</p>
    };
  },

  keyListener: function (e) {
    // Enter.
    if (this.state.revealed && e.keyCode === 13) {
      e.preventDefault();
      this.onConfirm();
    }
  },

  onConfirm: function () {
    this.setState({revealed: false});
    this.state.onConfirm();
  },

  onCancel: function () {
    this.setState({revealed: false});
    this.state.onCancel();
  },

  componentDidMount: function () {
    if (theConfirmationModal !== null) {
      throw new Error('<ConfirmationPrompt /> component was already mounted. Only 1 is allowed.');
    }
    theConfirmationModal = this;
    document.addEventListener('keypress', this.keyListener);
  },

  componentWillUnmount: function () {
    document.removeEventListener('keypress', this.keyListener);
  },

  render: function () {
    return (
      <Modal
        id='confirmation-prompt'
        className='modal--small modal--prompt'
        onCloseClick={this.onCancel}
        revealed={this.state.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{this.state.title}</h1>
            <div className='modal__description'>
              {this.state.description}
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {this.state.body}
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onCancel}><span>{t('Cancel')}</span></button>
          <button className='mfa-tick' type='submit' onClick={this.onConfirm}><span>{t('Confirm')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ConfirmationPrompt;

export function showConfirm (opt, onConfirm = noop, onCancel = noop) {
  if (theConfirmationModal === null) {
    throw new Error('<ConfirmationPrompt /> component not mounted');
  }

  theConfirmationModal.setState(Object.assign({}, opt, {
    revealed: true,
    onConfirm,
    onCancel
  }));
}
