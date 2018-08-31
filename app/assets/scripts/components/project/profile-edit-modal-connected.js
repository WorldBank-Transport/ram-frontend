'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import { t } from '../../utils/i18n';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

/**
 * Compute a path by giving a series os indexes to drill down.
 * This function has variadic arguments, with a minimum of 1.
 * All arguments must be numeric except the last which can also be (key|value)
 * when the function has 2 or more arguments.
 *
 * @returns {string} Path
 */
const computePath = function () {
  const args = Array.from(arguments);
  if (args.length === 0) throw new Error('Insufficient args');

  const isFinal = (arg) => arg === 'key' || arg === 'value';

  return args.reduce((path, arg, i) => {
    const next = args[i + 1];
    // If the next arg is final only include the index.
    if (isFinal(next)) return `${path}[${arg}]`;
    return isFinal(arg) ? `${path}.${arg}` : `${path}[${arg}].values`;
  }, '');
};

/**
 * Get all field paths by recursively going through the data.
 * Expects data to have the following structure:
 * {
 *  values: [
 *    {key, value}
 *    ...
 *  ]
 * }
 *
 * or for multilevel:
 * {
 *  values: [
 *    {
 *      values: [
 *        {key, value}
 *        ...
 *      ]
 *    }
 *    ...
 *  ]
 * }
 *
 * @param {Object} data Data object to check
 * @param {int} idx Index of the object
 *
 * @returns {array} Paths
 */
const getPaths = (data, idx) => {
  if (typeof data.value !== 'undefined') {
    return [`[${idx}].key`, `[${idx}].value`];
  } else {
    return data.values.reduce((acc, val, valIdx) => {
      const paths = getPaths(val, valIdx).map(p => `[${idx}].values${p}`);
      return acc.concat(paths);
    }, []);
  }
};

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
      errors: [],
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

  componentWillUnmount () {
    // this.props.resetForm();
  }

  onClose () {
    // this.props.resetForm();
    this.setState(this.getInitialState());
    this.props.onCloseClick();
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

  checkErrorField (path, setState = true) {
    const val = _.get(this.state.data, path, '').toString();
    const errors = _.cloneDeep(this.state.errors);
    let control = true;

    // Value or Key
    if (path.match(/\.value$/)) {
      // Values can only have numbers.
      control = !!val.match(/^[0-9]+(\.[0-9]+)?$/);
    } else {
      // Keys can have alphanumeric values, dashes, underscores and colons.
      control = !!val.match(/^[a-zA-Z0-9-_:]+$/);
    }

    if (setState) {
      _.set(errors, path, !control);
      this.setState({errors});
    }

    return control;
  }

  allowSubmit () {
    // if (this.props.rahForm.processing) return false;

    const paths = this.state.data.reduce((acc, o, oi) => {
      return acc.concat(getPaths(o, oi));
    }, []);

    // Check errors.
    return paths.every(f => this.checkErrorField(f, false));
  }

  onSubmit (e) {
    e.preventDefault && e.preventDefault();
  }

  renderSection ({multi, key, label}) {
    const sectionIdx = _.findIndex(this.state.data, o => o.section === key);
    if (sectionIdx === -1) return null;

    return multi
      ? this.renderSectionMulti(key, label, this.state.data[sectionIdx], sectionIdx)
      : this.renderSectionSingle(key, label, this.state.data[sectionIdx], sectionIdx);
  }

  renderSectionSingle (sectionKey, sectionLabel, sectionData, sectionIdx) {
    const attributes = sectionData.values;

    return (
      <div key={sectionKey}>
        <label className={c('form__label')}>{sectionLabel}</label>

        {attributes.map((data, attrIdx) => {
          const attrKey = data.key;
          const attrValue = data.value;
          // Object paths to access the object. Used by lodash methods to
          // add/remove/change/validate values.
          const attrKeyPath = computePath(sectionIdx, attrIdx, 'key');
          const attrValuePath = computePath(sectionIdx, attrIdx, 'value');

          return (
            <fieldset key={`${sectionKey}-${attrIdx}`} className={c('form__fieldset')}>
              <FieldsetHeader title={t('Tag {idx}', {idx: attrIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, computePath(sectionIdx), attrIdx)} />

              <div className='form__hascol form__hascol--2'>
                <InputField
                  id={`${sectionKey}-${attrKey}-tag`}
                  label='Tag name'
                  value={attrKey.toString()}
                  onBlur={this.checkErrorField.bind(this, attrKeyPath)}
                  hasError={_.get(this.state.errors, attrKeyPath, false)}
                  onValueChange={this.onFieldChange.bind(this, attrKeyPath)} />

                <InputField
                  id={`${sectionKey}-${attrKey}-value`}
                  label='Speed'
                  value={attrValue.toString()}
                  onBlur={this.checkErrorField.bind(this, attrValuePath)}
                  hasError={_.get(this.state.errors, attrValuePath, false)}
                  onValueChange={this.onFieldChange.bind(this, attrValuePath)} />
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
          // Object paths to access the object. Used by lodash methods to
          // add/remove/change/validate values.
          const attrKeyPath = computePath(sectionIdx, attrIdx, 'key');

          return (
            <fieldset key={`${sectionKey}-${attrIdx}`} className={c('form__fieldset')}>
              <FieldsetHeader title={t('Tag {idx}', {idx: attrIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, computePath(sectionIdx), attrIdx)} />
              <InputField
                id={`${sectionKey}-${attrIdx}-tag`}
                label='Tag name'
                value={attrKey.toString()}
                onBlur={this.checkErrorField.bind(this, attrKeyPath)}
                hasError={_.get(this.state.errors, attrKeyPath, false)}
                onValueChange={this.onFieldChange.bind(this, attrKeyPath)} />

              {attrValues.map((valData, valIdx) => {
                const valDataKeyPath = computePath(sectionIdx, attrIdx, valIdx, 'key');
                const valDataValuePath = computePath(sectionIdx, attrIdx, valIdx, 'value');

                return (
                  <fieldset key={`${sectionKey}-${attrIdx}-${valIdx}`} className={c('form__fieldset')}>
                    <FieldsetHeader title={t('Tag value {idx}', {idx: valIdx + 1})} onRemoveClick={this.onTagRemove.bind(this, computePath(sectionIdx, attrIdx), valIdx)} />
                    <div className='form__hascol form__hascol--2'>
                      <InputField
                        id={`${sectionKey}-${attrIdx}-${valIdx}-tag`}
                        label='Tag value'
                        value={valData.key.toString()}
                        onBlur={this.checkErrorField.bind(this, valDataKeyPath)}
                        hasError={_.get(this.state.errors, valDataKeyPath, false)}
                        onValueChange={this.onFieldChange.bind(this, valDataKeyPath)} />
                      <InputField
                        id={`${sectionKey}-${attrIdx}-${valIdx}-value`}
                        label='Speed'
                        value={valData.value.toString()}
                        onBlur={this.checkErrorField.bind(this, valDataValuePath)}
                        hasError={_.get(this.state.errors, valDataValuePath, false)}
                        onValueChange={this.onFieldChange.bind(this, valDataValuePath)} />
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
          <button className={c('mfa-tick', {'disabled': !this.allowSubmit()})} type='submit' onClick={this.onSubmit}><span>{t('Save')}</span></button>
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

FieldsetHeader.propTypes = {
  title: T.string,
  onRemoveClick: T.func
};

const InputField = ({id, label, value, onValueChange, onBlur, hasError}) => {
  const classNames = c('form__control', {
    'form__control--danger': hasError
  });

  return (
    <div className='form__group'>
      <label className='form__label' htmlFor={id}>{label}</label>
      <input type='text' id={id} name={id} className={classNames} value={value} onChange={onValueChange} onBlur={onBlur} />
      {/* <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p> */}
    </div>
  );
};

InputField.propTypes = {
  id: T.string,
  label: T.string,
  value: T.string,
  hasError: T.bool,
  onValueChange: T.func,
  onBlur: T.func
};
