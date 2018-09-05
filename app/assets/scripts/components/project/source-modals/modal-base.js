'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { t } from '../../../utils/i18n';
import { getfFileTypesMatrix } from '../../../utils/constants';

import { Modal, ModalHeader, ModalFooter } from '../../modal';

class ModalBase extends React.Component {
  allowSubmit () { return true; }

  renderHeader () {
    let { display, description } = getfFileTypesMatrix()[this.props.type];
    return (
      <ModalHeader>
        <div className='modal__headline'>
          <h1 className='modal__title'>{t('Edit {type}', {type: display})}</h1>
          <div className='modal__description'>
            <p>{description}</p>
          </div>
        </div>
      </ModalHeader>
    );
  }

  renderFooter () {
    return (
      <ModalFooter>
        <button className='mfa-xmark' type='button' onClick={this.props.onCloseClick}><span>{t('Cancel')}</span></button>
        <button className={c('mfa-tick', {disabled: !this.allowSubmit()})} type='submit' onClick={this.onSubmit.bind(this)} disabled={!this.allowSubmit()}><span>{t('Save')}</span></button>
      </ModalFooter>
    );
  }

  render () {
    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--medium'
        onCloseClick={this.props.onCloseClick}
        revealed={this.props.revealed} >

        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}

      </Modal>
    );
  }
}

ModalBase.propTypes = {
  onCloseClick: T.func,
  type: T.string,
  revealed: T.bool
};

export default ModalBase;
