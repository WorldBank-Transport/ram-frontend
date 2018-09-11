'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import c from 'classnames';
import _ from 'lodash';

import { t } from '../../utils/i18n';
import { showGlobalLoading, hideGlobalLoading } from '../global-loading';
import { fetchProfileSettings, postProfileSettings, resetProfileSettingsForm, showAlert } from '../../actions';

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

/**
 * Converts profile settings object from the API to state compliant structure.
 * Supports nested values for multi level settings.
 * Form:
 * {
 *  foo: 'bar',
 *  baz: 'boo',
 *  nested: {
 *    a: 1
 *  }
 * }
 * To:
 * [
 *   { key: 'foo', value: 'bar' },
 *   { key: 'baz', value: 'boo' },
 *   { key: 'nested', values: [{ key: a, value: 1 }] }
 * ]
 *
 * @param {object} settings Settings object
 */
const settingsToState = (settings) => {
  if (!settings) return [];

  const keys = Object.keys(settings);
  return keys.map(k => {
    if (typeof settings[k] === 'object') {
      return {
        key: k,
        values: settingsToState(settings[k])
      };
    }

    return {
      key: k,
      value: settings[k]
    };
  });
};

/**
 * Converts the state data array to API profile settings compliant structure.
 * Supports nested values for multi level settings.
 * Form:
 * [
 *   { key: 'foo', value: 'bar' },
 *   { key: 'baz', value: 'boo' },
 *   { key: 'nested', values: [{ key: a, value: 1 }] }
 * ]
 * To:
 * {
 *  foo: 'bar',
 *  baz: 'boo',
 *  nested: {
 *    a: 1
 *  }
 * }
 *
 * @param {object} settings Settings object
 */
const stateToSettings = (state) => {
  if (!state) return {};

  return state.reduce((acc, d) => {
    return Object.assign({}, acc, {
      [d.key]: typeof d.values !== 'undefined'
        ? stateToSettings(d.values)
        : d.value
    });
  }, {});
};

// How the profile edit works:
// Section are gorups of speeds that can be edited (ex: "Surface Speeds",
// "Tracktype Speeds", "Smoothness Speeds", etc) These are required by the api
// and defined on the server alongside the labels.
// A section can have the `multi` flag set, which means that two levels are
// allowed.

class ProfileEditModal extends React.Component {
  constructor (props) {
    super(props);

    this.state = this.getInitialState();
    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.renderSection = this.renderSection.bind(this);
  }

  getInitialState () {
    // Normal section structure:
    // {
    //   section: 'surface_speeds',
    //   values: [
    //     { key: 'asphalt', value: 100 },
    //     { key: 'dirt', value: 20 }
    //   ]
    // }
    //
    // Section structure when `multi` is true:
    // {
    //   section: 'speeds',
    //   values: [
    //     {
    //       key: 'highway',
    //       values: [
    //         {
    //           key: 'primary',
    //           value: 100
    //         }
    //       ]
    //     }
    //   ]
    // }

    return { errors: [], data: [] };
  }

  computeDataFromSettings (profileSettings) {
    return profileSettings.sections.map(({key}) => ({
      section: key,
      values: settingsToState(profileSettings.settings[key])
    }));
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.revealed && !nextProps.revealed) {
      // If the modal is not, nor is going to be revealed, do nothing.
      return;
    }

    // When the modal is open fetch the profile data from the API.
    if (!this.props.revealed && nextProps.revealed) {
      showGlobalLoading();
      this.props._fetchProfileSettings(this.props.projectId)
        .then(() => {
          hideGlobalLoading();
        });
    }

    // Once the profile settings are fetched, compute the state.
    if (this.props.profileSettings.fetching &&
      !nextProps.profileSettings.fetching &&
      nextProps.profileSettings.fetched) {
      if (nextProps.profileSettings.error) {
        this.props._showAlert('danger', <p>{nextProps.profileSettings.error.message}</p>, true);
        return this.onClose();
      }
      this.setState({data: this.computeDataFromSettings(nextProps.profileSettings.data)});
    }

    // Once the form has been submitted display the error/success message.
    if (this.props.profileSettingsForm.processing && !nextProps.profileSettingsForm.processing) {
      if (!nextProps.profileSettingsForm.error) {
        this.props._showAlert('success', <p>{t('Profile settings successfully updated')}</p>, true, 4500);
        this.onClose();
      } else {
        this.props._showAlert('danger', <p>{nextProps.profileSettingsForm.error.message}</p>, true);
      }
    }
  }

  componentWillUnmount () {
    this.props._resetProfileSettingsForm();
  }

  onClose () {
    this.props._resetProfileSettingsForm();
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
    if (this.props.profileSettingsForm.processing) return false;

    // Get all the paths for keys and values.
    const paths = this.state.data.reduce((acc, o, oi) => {
      return acc.concat(getPaths(o, oi));
    }, []);

    // Check errors.
    return paths.every(f => this.checkErrorField(f, false));
  }

  onSubmit (e) {
    e.preventDefault && e.preventDefault();

    // Prepare payload.
    const payload = this.state.data.reduce((acc, d) => {
      return Object.assign({}, acc, {
        [d.section]: stateToSettings(d.values)
      });
    }, {});

    showGlobalLoading();
    this.props._postProfileSettings(this.props.projectId, payload)
      .then(() => hideGlobalLoading());
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
    const { fetched, fetching, data } = this.props.profileSettings;

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
          {fetched && !fetching ? (
            <form className='form'>
              {data.sections.map(this.renderSection)}
            </form>
          ) : null}
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
  revealed: T.bool,
  onCloseClick: T.func,
  _fetchProfileSettings: T.func,
  _postProfileSettings: T.func,
  _resetProfileSettingsForm: T.func,
  _showAlert: T.func,
  profileSettings: T.object,
  projectId: T.number,
  profileSettingsForm: T.object
};

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    profileSettings: state.profileSettings,
    profileSettingsForm: state.profileSettingsForm
  };
}

function dispatcher (dispatch) {
  return {
    _fetchProfileSettings: (...args) => dispatch(fetchProfileSettings(...args)),
    _postProfileSettings: (...args) => dispatch(postProfileSettings(...args)),
    _resetProfileSettingsForm: (...args) => dispatch(resetProfileSettingsForm(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args))
  };
}

export default connect(selector, dispatcher)(ProfileEditModal);

//
// Helper components.
//

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
