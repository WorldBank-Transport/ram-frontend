'use strict';
import React from 'react';

import Dropdown from '../components/dropdown';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/modal';

class Playground extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  openModal () {
    console.log('thi', this);
    this.setState({modalOpen: true});
  }

  closeModal () {
    this.setState({modalOpen: false});
  }

  renderPlaygroundContent () {
    return (
      <p>Welcome to the playground</p>
    );
  }

  renderModal () {
    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--medium'
        onCloseClick={this.closeModal.bind(this)}
        revealed={this.state.modalOpen} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>Create new scenario</h1>
            <div className='modal__description'>
              <p>Lorem ipsum dolor sit amet.</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>

          <form className='form'>
            <div className='form__group'>
              <label className='form__label' htmlFor='inputText1'>{('Input 01')}</label>
              <input type='text' id='inputText1' name='inputText1' className='form__control' placeholder={('Input text')} />
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='inputText5'>{('Input 05')}</label>
              <div className='form__input-group'>
                <span className='form__input-addon'><i className='form__input-addon-label'>Prefix addon</i></span>
                <input type='text' id='inputText5' name='inputText5' className='form__control' placeholder={('Input text')} />
                <div className='form__input-addon'><button type='button' className='button button--danger-plain button--text-hidden' title='Delete fieldset'><i className='collecticon-trash-bin'></i><span>Delete</span></button></div>
              </div>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='inputText2'>{('Input file 02')}</label>
              <div className='form__file'>
                <span className='form__file__text'>Choose file</span>
                <input type='file' id='inputFile2' name='inputFile2' placeholder={('Input file')} />
              </div>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='inputText3'>{('Input file 03')}</label>
              <div className='form__file form__file--remove'>
                <span className='form__file__text'>my_first_file.json</span>
                <input type='file' id='inputFile3' name='inputFile3' placeholder={('Input file')} readOnly />
              </div>
            </div>

            <div className='form__group form__group--attached'>
              <label className='form__label visually-hidden' htmlFor='road-network-clone-options'>Clone from scenario</label>
              <select name='road-network-clone-options' id='road-network-clone-options' className='form__control'>
                <option value='1100'>Main scenario 1100</option>
                <option value='1200'>Other</option>
                <option value='1400'>Yet Other</option>
              </select>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='project-desc'>Description <small>optional</small></label>
              <textarea id='project-desc' rows='2' className='form__control' placeholder='Say something about this project'></textarea>
              <p className='form__help'>140 characters left</p>
            </div>

            <div className='form__group'>
              <label className='form__label' htmlFor='Toggles'>{('Toggles')}</label>

              <label htmlFor='switch1' className='form__option form__option--switch' title='Toggle on/off'>
                <input type='checkbox' name='switch1' id='switch1' value='on' />
                <span className='form__option__text'>Switch 01</span>
                <span className='form__option__ui'></span>
              </label>

              <label htmlFor='switch2' className='form__option form__option--checked form__option--switch' title='Toggle on/off'>
                <input type='checkbox' name='switch2' id='switch2' value='on' checked />
                <span className='form__option__text'>Switch 02</span>
                <span className='form__option__ui'></span>
              </label>

              <label htmlFor='switch3' className='form__option form__option--switch option fos-io' title='Toggle on/off'>
                <input type='checkbox' name='switch3' id='switch3' value='on' />
                <span className='form__option__ui'></span>
                <span className='form__option__text'>Switch 03</span>
              </label>

              <label htmlFor='switch4' className='form__option form__option--text-hidden form__option--switch' title='Toggle on/off'>
                <input type='checkbox' name='switch4' id='switch4' value='on' />
                <span className='form__option__ui'></span>
                <span className='form__option__text'>Switch 04</span>
              </label>
            </div>

            <div className='form__group'>
              <label className='form__label'>Basic checkboxes</label>

              <label className='form__option' title='This is a title'>
                <input type='checkbox' name='checkbox-basic1' />
                <span className='form__option__text'>Checkbox 01</span>
              </label>
            </div>

            <div className='form__group'>
              <label className='form__label'>Road network</label>

              <label className='form__option form__option--inline form__option--custom-radio'>
                <input type='radio' name='radio1' id='radio1a' />
                <span className='form__option__ui'></span>
                <span className='form__option__text'>Radio 01</span>
              </label>

              <label className='form__option form__option--inline form__option--custom-radio'>
                <input type='radio' name='radio1' id='radio1b' />
                <span className='form__option__ui'></span>
                <span className='form__option__text'>Radio 02</span>
              </label>
            </div>

            <div className='form__group'>
              <div className='form__inner-header'>
                <div className='form__inner-headline'>
                  <label className='form__label' htmlFor='inputText4'>{('Input 04')}</label>
                </div>
                <div className='form__inner-actions'>
                  <dl className='form__options-menu'>
                    <dt>Select</dt>
                    <dd><button type='button' className='fia-global' title={('Select all')}><span>{('All')}</span></button></dd>
                    <dd><button type='button' className='fia-global' title={('Deselect none')}><span>{('None')}</span></button></dd>
                  </dl>
                </div>
              </div>

              <div className='form__hascol form__hascol--3'>

                <label className='form__option form__option--custom-checkbox' title='This is a title'>
                  <input type='checkbox' name='checkbox1' />
                  <span className='form__option__ui'></span>
                  <span className='form__option__text'>Checkbox 01</span>
                </label>
                <label className='form__option form__option--custom-checkbox' title='This is a title'>
                  <input type='checkbox' name='checkbox2' />
                  <span className='form__option__ui'></span>
                  <span className='form__option__text'>Checkbox 02</span>
                </label>
                <label className='form__option form__option--custom-checkbox' title='This is a title'>
                  <input type='checkbox' name='checkbox3' />
                  <span className='form__option__ui'></span>
                  <span className='form__option__text'>Checkbox 03</span>
                </label>
                <label className='form__option form__option--custom-checkbox' title='This is a title'>
                  <input type='checkbox' name='checkbox4' />
                  <span className='form__option__ui'></span>
                  <span className='form__option__text'>Checkbox 04</span>
                </label>
                <label className='form__option form__option--custom-checkbox' title='This is a title'>
                  <input type='checkbox' name='checkbox5' />
                  <span className='form__option__ui'></span>
                  <span className='form__option__text'>Checkbox 05</span>
                </label>

              </div>

            </div>

            <fieldset className='form__fieldset'>
              <div className='form__inner-header'>
                <div className='form__inner-headline'>
                  <legend className='form__legend'>Fieldset 01</legend>
                </div>
                <div className='form__inner-actions'>
                  <button type='button' className='fia-trash' title='Delete fieldset'><span>Delete</span></button>
                </div>
              </div>

              <div className='form__hascol form__hascol--2'>
                <div className='form__group'>
                  <label className='form__label' htmlFor='inputText2'>{('Input 02')}</label>
                  <input type='text' id='inputText2' name='inputText2' className='form__control' placeholder={('Input text')} />
                </div>
                <div className='form__group'>
                  <label className='form__label' htmlFor='inputText3'>{('Input 03')}</label>
                  <input type='text' id='inputText3' name='inputText3' className='form__control' placeholder={('Input text')} />
                </div>
              </div>
            </fieldset>

            <div className='form__extra-actions'>
              <button type='button' className='fea-plus' title='Add new fieldset'><span>New fieldset</span></button>
            </div>
          </form>

        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button'><span>{('Cancel')}</span></button>
          <button className={('mfa-tick')} type='submit'><span>{('Create')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }

  render () {
    return (
      <section className='inpage inpage--single'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>{('Playground')}</h1>
            </div>
            <div className='inpage__actions'>
              <button className='ipa-main' type='button' onClick={this.openModal.bind(this)}><span>Open Modal</span></button>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            {this.renderPlaygroundContent()}

            <div>
              <Dropdown
                className='eta-vis__overlays-menu'
                triggerClassName='etavb-overlays'
                triggerActiveClassName='button--active'
                triggerText={('Map overlays')}
                triggerTitle={('Toggle map overlays')}
                direction='down'
                alignment='left' >
                  <h6 className='drop__title'>Toggle overlays</h6>
                  <label htmlFor='switch1' className='form__option form__option--switch' title='Toggle on/off'>
                    <input type='checkbox' name='switch1' id='switch1' value='on' />
                    <span className='form__option__text'>Origins</span>
                    <span className='form__option__ui'></span>
                  </label>
                  <label htmlFor='switch2' className='form__option form__option--switch' title='Toggle on/off'>
                    <input type='checkbox' name='switch2' id='switch2' value='on' />
                    <span className='form__option__text'>Destinations</span>
                    <span className='form__option__ui'></span>
                  </label>
                  <label htmlFor='switch3' className='form__option form__option--switch' title='Toggle on/off'>
                    <input type='checkbox' name='switch3' id='switch3' value='on' />
                    <span className='form__option__text'>Admin boundaries</span>
                    <span className='form__option__ui'></span>
                  </label>
                  <label htmlFor='switch4' className='form__option form__option--switch' title='Toggle on/off'>
                    <input type='checkbox' name='switch4' id='switch4' value='on' />
                    <span className='form__option__text'>Road network</span>
                    <span className='form__option__ui'></span>
                  </label>
              </Dropdown>
            </div>

            {this.renderModal()}
          </div>
        </div>
      </section>
    );
  }
}

// /////////////////////////////////////////////////////////////////// //
// Connect functions

export default Playground;
