'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { t } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

class ProjectExportModal extends React.Component {
  allowSubmit () {
    return false;
  }

  onSubmit () {

  }

  render () {
    return (
      <Modal
        id='modal-project-export'
        className='modal--small'
        onCloseClick={() => {}}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Export to Rural Accessibility Hub')}</h1>
            <div className='modal__description'>
              <p>{t('Share your analysis with the world by publishing it on')} <a href='http://datahub.ruralaccess.info' title='Visit'>Rural Accessibility Hub</a>.</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <form className='form'>
            <fieldset className='form__fieldset'>
              <legend className='form__legend'>{t('Project')}</legend>

              <div className='form__group'>
                <label className='form__label' htmlFor='project__title'>{t('Title')}</label>
                <input type='text' id='project__title' name='project__title' className='form__control' placeholder={t('Untitled project')} />
              </div>

              <div className='form__hascol form__hascol--2'>
                <div className='form__group'>
                  <label className='form__label' htmlFor='project__date'>{t('Date')}</label>
                  <input type='date' id='project__date' name='project__date' className='form__control' placeholder={t('Select a date')} />
                </div>
                <div className='form__group'>
                  <label className='form__label' htmlFor='project__location'>{t('Location')}</label>
                  <select name='project__location' id='project__location' className='form__control'>
                    <option>{t('Select a country')}</option>
                    <option value='Country #1'>Country #1</option>
                    <option value='Country #2'>Country #2</option>
                  </select>
                </div>
              </div>

              <div className='form__group'>
                <label className='form__label' htmlFor='project__topics'>{t('Topics')}</label>
                <input type='text' id='project__topics' name='project__topics' className='form__control' placeholder={t('Give it one or more topics. E.g. "road upgrade"')} />
                <p className='form__help'>{t('Comma separated')}</p>
              </div>

              <div className='form__group'>
                <label className='form__label' htmlFor='project__description'>{t('Description')}</label>
                <textarea id='project__description' name='project__description' rows='4' className='form__control' placeholder={t('Say something about this project')}></textarea>
                <p className='form__help'>{t('Markdown is allowed.')} <a href='https://daringfireball.net/projects/markdown/syntax' title={t('Learn more')} target='_blank'>{t('What is this?')}</a></p>
              </div>

              <div className='form__group'>
                <label className='form__label' htmlFor='project__authors'>{t('Authors')}</label>
                <input type='text' id='project__authors' name='project__authors' className='form__control' placeholder={t('Who created this?')} />
                <p className='form__help'>{t('Comma separated')}</p>
              </div>
            </fieldset>

            <fieldset className='form__fieldset'>
              <legend className='form__legend'>{t('Contact person')}</legend>

              <div className='form__hascol form__hascol--2'>
                <div className='form__group'>
                  <label className='form__label' htmlFor='contact-person__name'>{t('Name')}</label>
                  <input type='text' id='contact-person__name' name='contact-person__name' className='form__control' placeholder={t('Tell us who you are')} />
                </div>

                <div className='form__group'>
                  <label className='form__label' htmlFor='contact-person__email'>{t('Email')}</label>
                  <input type='email' id='contact-person__email' name='contact-person__email' className='form__control' placeholder={t('Let’s connect')} />
                </div>
              </div>

              <div className='form__note'>
                <p>{t('Note that your information will become public.')}</p>
              </div>
            </fieldset>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className={c('mfa-tick', {'disabled': !this.allowSubmit()})} type='submit' onClick={this.onSubmit}><span>{t('Export')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
}

ProjectExportModal.propTypes = {
  message: T.string,
  revealed: T.bool
};

export default ProjectExportModal;
