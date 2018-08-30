'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import { t } from '../../utils/i18n';
import { limitHelper, toTimeStr } from '../../utils/utils';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const nameLimit = limitHelper(80);
class ProfileEditModal extends React.Component {
  constructor (props) {
    super(props);

    this.state = this.getInitialState();
    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.renderSection = this.renderSection.bind(this);

    this.sections = [
      {
        label: 'Surface Speeds',
        key: 'surface_speeds'
      },
      {
        label: 'Tracktype Speeds',
        key: 'tracktype_speeds'
      },
      {
        label: 'Speeds',
        key: 'speeds',
        multi: true
      }
    ];
  }

  getInitialState () {
    return {
      data: [
        {
          section: 'speeds',
          values: [
            {
              key: 'highway',
              values: [
                {
                  key: 'primary',
                  value: 100
                }
              ]
            }
          ]
        },
        {
          section: 'surface_speeds',
          values: [
            { key: 'asphalt', value: 100 },
            { key: 'dirt', value: 20 }
          ]
        },
        {
          section: 'tracktype_speeds',
          values: []
        }
      ]
    };
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.revealed && !nextProps.revealed) {
      // If the modal is not, nor is going to be revealed, do nothing.
      return;
    }
  }

  onFieldChange (path, e) {
    // Path is as used by the lodash method.
    e.preventDefault();
    const val = e.target ? e.target.value : e;
    let stateData = _.cloneDeep(this.state.data);
    _.set(stateData, path, val);
    this.setState({data: stateData});
  }

  onTagRemove (path, index, e) {
    // Path is as used by the lodash method.
    e.preventDefault();
    let stateData = _.cloneDeep(this.state.data);
    _.get(stateData, path).splice(index, 1);
    this.setState({data: stateData});
    console.log('stateData', stateData);
  }

  onTagAdd (path, isMulti, e) {
    // Path is as used by the lodash method.
    e.preventDefault();
    let stateData = _.cloneDeep(this.state.data);
    if (isMulti) {
      _.get(stateData, path).push({ key: '', values: [] });
    } else {
      _.get(stateData, path).push({ key: '', value: '' });
    }
    this.setState({data: stateData});
  }

  checkErrorField (field, setState = true) {
  }

  allowSubmit () {
    // if (this.props.rahForm.processing) return false;

    // // Check errors.
    // const fields = Object.keys(this.state.data);
    // return fields.every(f => this.checkErrorField(f, false));
  }

  onSubmit (e) {
    e.preventDefault && e.preventDefault();
  }

  componentWillUnmount () {
    // this.props.resetForm();
  }

  onClose () {
    // this.props.resetForm();
    this.setState(this.getInitialState());
    this.props.onCloseClick();
  }

  renderSection ({multi, key, label}) {
    const sectionIdx = _.findIndex(this.state.data, o => o.section === key);
    if (sectionIdx === -1) return null;

    return multi ? this.renderSectionMulti(key, label, this.state.data[sectionIdx], sectionIdx) : this.renderSectionSingle(key, label, this.state.data[sectionIdx], sectionIdx);
  }

  renderSectionSingle (sectionKey, sectionLabel, sectionData, sectionIdx) {
    const attributes = sectionData.values;
    return (
      <div key={sectionKey}>
        <label className={c('form__label')}>{sectionLabel}</label>

        {attributes.map((data, attrIdx) => {
          const attrKey = data.key;
          const attrValue = data.value;

          return (
            <fieldset key={`${sectionKey}-${attrIdx}`} className={c('form__fieldset')}>
              <FieldsetHeader title={t('Tag {idx}', {idx: attrIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, `[${sectionIdx}].values`, attrIdx)} />

              <div className='form__hascol form__hascol--2'>
                <InputField
                  id={`${sectionKey}-${attrKey}-tag`}
                  label='Tag name'
                  value={attrKey.toString()}
                  onValueChange={this.onFieldChange.bind(this, [sectionIdx, 'values', attrIdx, 'key'])} />

                <InputField
                  id={`${sectionKey}-${attrKey}-value`}
                  label='Speed'
                  value={attrValue.toString()}
                  onValueChange={this.onFieldChange.bind(this, [sectionIdx, 'values', attrIdx, 'value'])} />
              </div>
            </fieldset>
          );
        })}

        <div className='form__extra-actions'>
          <button type='button' className={c('fea-plus')} title={t('Add new tag')} onClick={this.onTagAdd.bind(this, [sectionIdx, 'values'], false)}><span>{t('New Tag')}</span></button>
        </div>
      </div>
    );
  }

  renderSectionMulti (sectionKey, sectionLabel, sectionData, sectionIdx) {
    const attributes = sectionData.values;

    return (
      <div key={sectionKey}>
        <label className={c('form__label')}>{sectionLabel}</label>

        {attributes.map((data, attrIdx) => {
          const attrKey = data.key;
          const attrValues = data.values;

          return (
            <fieldset key={`${sectionKey}-${attrIdx}`} className={c('form__fieldset')}>
              <FieldsetHeader title={t('Tag {idx}', {idx: attrIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, `[${sectionIdx}].values`, attrIdx)} />
              <InputField
                id={`${sectionKey}-${attrIdx}-tag`}
                label='Tag name'
                value={attrKey.toString()}
                onValueChange={this.onFieldChange.bind(this, [sectionIdx, 'values', attrIdx, 'key'])} />

              {attrValues.map((valData, valIdx) => {
                return (
                  <fieldset key={`${sectionKey}-${attrIdx}-${valIdx}`} className={c('form__fieldset')}>
                    <FieldsetHeader title={t('Tag value {idx}', {idx: valIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, `[${sectionIdx}].values[${attrIdx}].values`, valIdx)} />
                    <div className='form__hascol form__hascol--2'>
                      <InputField
                        id={`${sectionKey}-${attrIdx}-${valIdx}-tag`}
                        label='Tag value'
                        value={valData.key.toString()}
                        onValueChange={this.onFieldChange.bind(this, [sectionIdx, 'values', attrIdx, 'values', valIdx, 'key'])} />
                      <InputField
                        id={`${sectionKey}-${attrIdx}-${valIdx}-value`}
                        label='Speed'
                        value={valData.value.toString()}
                        onValueChange={this.onFieldChange.bind(this, [sectionIdx, 'values', attrIdx, 'values', valIdx, 'value'])} />
                    </div>
                  </fieldset>
                );
              })}
                <div className='form__extra-actions'>
                  <button type='button' className={c('fea-plus')} title={t('Add new tag')} onClick={this.onTagAdd.bind(this, [sectionIdx, 'values', attrIdx, 'values'], false)}><span>{t('New Tag Value')}</span></button>
                </div>
            </fieldset>
          );
        })}

        <div className='form__extra-actions'>
          <button type='button' className={c('fea-plus')} title={t('Add new tag')} onClick={this.onTagAdd.bind(this, [sectionIdx, 'values'], true)}><span>{t('New Tag')}</span></button>
        </div>
      </div>
    );
  }

  render () {
    return (
      <Modal
        id='modal-project-export'
        className='modal--medium'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Edit OSRM Profile')}</h1>
            <div className='modal__description'>
              <p>{t('Edit profile speeds')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <form className='form'>
            {this.sections.map(this.renderSection)}
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

ProfileEditModal.propTypes = {
  _postRAHExport: T.func,
  resetForm: T.func,
  revealed: T.bool,
  projectId: T.string,
  rahForm: T.object,
  onCloseClick: T.func
};

export default ProfileEditModal;

const FieldsetHeader = ({title, onRemoveClick}) => (
  <div className='form__inner-header'>
    <div className='form__inner-headline'>
      <legend className='form__legend'>{title}</legend>
    </div>
    <div className='form__inner-actions'>
      <button type='button' className={c('fia-trash', {disabled: false})} title={t('Delete fieldset')} onClick={onRemoveClick}><span>{t('Delete')}</span></button>
    </div>
  </div>
);

const InputField = ({id, label, value, onValueChange}) => (
  <div className='form__group'>
    <label className='form__label' htmlFor={id}>{label}</label>
    <input type='text' id={id} name={id} className='form__control' value={value} onChange={onValueChange} />
    {/* <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p> */}
  </div>
);

InputField.propTypes = {
  id: T.string,
  label: T.string,
  value: T.string,
  onValueChange: T.func
};
