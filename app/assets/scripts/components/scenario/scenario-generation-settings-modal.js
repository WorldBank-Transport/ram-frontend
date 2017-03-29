'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { t } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

// More info to add to each admin area:
// - Area in sqr/kms
// This is useful to know how big an area is.
// Sum the areas of the selected admin areas and warn the user if
// generating results might be a problem because of the size.

const ScenarioGenSettingsModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioForm: T.object,
    scenarioData: T.object,

    saveScenario: T.func,
    resetForm: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func
  },

  getInitialState: function () {
    return {
      errors: {
        name: null
      },
      data: {
        selectedAreas: this.props.scenarioData.admin_areas
          .filter(o => o.selected)
          .map(o => o.name)
      }
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.scenarioForm.processing && !nextProps.scenarioForm.processing) {
      this.props._hideGlobalLoading();
    }

    if (this.props.scenarioForm.action === 'edit' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing &&
        !nextProps.scenarioForm.error) {
      this.onClose();
      return;
    }

    if (!this.props.revealed && nextProps.revealed) {
      // Modal was revealed. Be sure the data is correct.
      this.setState({data: {
        selectedAreas: nextProps.scenarioData.admin_areas
          .filter(o => o.selected)
          .map(o => o.name)
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
    return control;
  },

  onSubmit: function (e) {
    e.preventDefault && e.preventDefault();

    if (this.checkErrors()) {
      var payload = {
        selectedAdminAreas: this.state.data.selectedAreas
      };
      return this.props.saveScenario(this.props.scenarioData.project_id, this.props.scenarioData.id, payload);
    }
  },

  onFieldChange: function (field, e) {
    if (field === 'selectedAreas') {
      let val = e.target.value;
      let areas = this.state.data.selectedAreas;
      let idx = areas.indexOf(val);
      if (idx === -1) {
        areas.push(val);
      } else {
        areas.splice(idx, 1);
      }
      let data = Object.assign({}, this.state.data, {selectedAreas: areas});
      return this.setState({data});
    }
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

  renderCheckbox: function (val, idx) {
    return (
      <label key={idx} className='form__option form__option--inline form__option--custom-checkbox'>
        <input type='checkbox' name={`checkbox-${idx}`} value={val.name} onChange={this.onFieldChange.bind(null, 'selectedAreas')} checked={this.state.data.selectedAreas.indexOf(val.name) !== -1}/>
        <span className='form__option__text'>{val.name}</span>
        <span className='form__option__ui'></span>
      </label>
    );
  },

  render: function () {
    let processing = this.props.scenarioForm.processing;

    return (
      <Modal
        id='modal-project-metadata'
        className='modal--small'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Admin areas')}</h1>
            <div className='modal__description'>
              <p>{t('Select the areas for which you want to generate data')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>

          {processing ? <p>Processing...</p> : null}

          {this.renderError()}

          <form className={c('form', {'disable': processing})} onSubmit={this.onSubmit}>
            <div className='form__group'>
              <label className='form__label'>Road network</label>

              {this.props.scenarioData.admin_areas.map(this.renderCheckbox)}

            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className='mfa-tick' type='submit' onClick={this.onSubmit}><span>{t('Save')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioGenSettingsModal;