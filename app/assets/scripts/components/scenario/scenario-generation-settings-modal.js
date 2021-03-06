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
    genResults: T.func,
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
          .map(o => o.id)
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
        !nextProps.scenarioForm.processing &&
        !nextProps.scenarioForm.error) {
      this.props._showGlobalLoading();
      this.props.genResults();
      this.onClose();
      return;
    }

    if (!this.props.revealed && nextProps.revealed) {
      // Modal was revealed. Be sure the data is correct.
      this.setState({data: {
        selectedAreas: nextProps.scenarioData.admin_areas
          .filter(o => o.selected)
          .map(o => o.id)
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

  selectAA: function (what) {
    if (what === 'none') {
      this.setState({data: {selectedAreas: []}});
    } else if (what === 'all') {
      this.setState({data: {
        selectedAreas: this.props.scenarioData.admin_areas.map(o => o.id)
      }});
    }
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
      let val = parseInt(e.target.value);
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

    return <p>{error.message || error.error}</p>;
  },

  renderCheckbox: function (val) {
    return (
      <label key={val.id} className='form__option form__option--custom-checkbox' title={val.name}>
        <input type='checkbox' name={`checkbox-${val.id}`} value={val.id} onChange={this.onFieldChange.bind(null, 'selectedAreas')} checked={this.state.data.selectedAreas.indexOf(val.id) !== -1}/>
        <span className='form__option__ui'></span>
        <span className='form__option__text truncated'>{val.name}</span>
      </label>
    );
  },

  render: function () {
    let processing = this.props.scenarioForm.processing;
    let isAAselected = !!this.state.data.selectedAreas.length;

    return (
      <Modal
        id='modal-project-metadata'
        className='modal--medium'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Analyze')}</h1>
            <div className='modal__description'>
              <p>{t('Select the areas for which you want to generate data. Note that generating new results will replace current ones.')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>

          {processing ? <p>Processing...</p> : null}

          {this.renderError()}

          <form className={c('form', {'disable': processing})} onSubmit={this.onSubmit}>
            <div className='form__group form-group-areas'>
              <div className='form__inner-header'>
                <div className='form__inner-headline'>
                  <label className='form__label'>{t('Admin areas')}</label>
                </div>
                <div className="form__inner-actions">
                  <dl className='form__options-menu'>
                    <dt>Select</dt>
                    <dd><button type='button' className='fia-global' title={t('Select all')} onClick={this.selectAA.bind(null, 'all')}><span>{t('All')}</span></button></dd>
                    <dd><button type='button' className='fia-global' title={t('Deselect none')} onClick={this.selectAA.bind(null, 'none')}><span>{t('None')}</span></button></dd>
                  </dl>
                </div>
              </div>

              <div className="form__hascol form__hascol--3">
                {this.props.scenarioData.admin_areas.map(this.renderCheckbox)}
              </div>

            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button className={c('mfa-tick', {disabled: !isAAselected})} type='submit' onClick={this.onSubmit} disabled={!isAAselected}><span>{t('Analyze')}</span></button>
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioGenSettingsModal;
