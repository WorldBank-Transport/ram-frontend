'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import ReactTags from 'react-tag-autocomplete';

import { t } from '../../utils/i18n';
import { limitHelper } from '../../utils/utils';
import countries from '../../utils/countries';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const nameLimit = limitHelper(80);
class ProjectExportModal extends React.Component {
  constructor (props) {
    super(props);

    this.state = this.getInitialState();

    // Bind all functions to avoid constant rebinds.
    this.onChangeTitle = this.onFieldChange.bind(this, 'title');
    this.onChangeDate = this.onFieldChange.bind(this, 'date');
    this.onChangeCountry = this.onFieldChange.bind(this, 'country');
    this.onChangeTopics = this.onFieldChange.bind(this, 'topics');
    this.onChangeAuthors = this.onFieldChange.bind(this, 'authors');
    this.onChangeContactName = this.onFieldChange.bind(this, 'contactName');
    this.onChangeContactEmail = this.onFieldChange.bind(this, 'contactEmail');
    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  getInitialState () {
    return {
      errors: {
        title: null,
        country: null,
        date: null,
        description: null,
        topics: null,
        authors: null,

        contactName: null,
        contactEmail: null
      },
      data: {
        title: '',
        country: '',
        date: '',
        description: '',
        topics: [],
        authors: [],

        contactName: '',
        contactEmail: ''
      }
    };
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.revealed && !nextProps.revealed) {
      // If the modal is not, nor is going to be revealed, do nothing.
      return;
    }

    if (this.props.rahForm.processing && !nextProps.rahForm.processing) {
      this.props._hideGlobalLoading();
    }
    if (this.props.rahForm.processing && !nextProps.rahForm.processing) {
      if (!nextProps.rahForm.error) {
        this.props._showAlert('success', <p>{t('Project successfully exported')}</p>, true, 4500);
        this.onClose();
      } else {
        this.props._showAlert('danger', <p>{nextProps.rahForm.error.message}</p>, true);
      }
      return;
    }
  }

  onFieldChange (field, e) {
    const val = e.target ? e.target.value : e;
    let data = Object.assign({}, this.state.data, {[field]: val});
    this.setState({data});
  }

  checkErrors () {
    let control = true;
    let errors = this.getInitialState().errors;
    const { title, contactEmail } = this.state.data;

    const fields = ['country', 'description', 'date', 'topics', 'authors', 'contactName'];

    if (title.length === 0 || !nameLimit(title.length).isOk()) {
      errors.title = true;
      control = false;
    }

    fields.forEach(f => {
      if (!this.state.data[f].length) {
        errors[f] = true;
        control = false;
      }
    });

    const atPos = contactEmail.indexOf('@');
    if (atPos === -1 || atPos !== contactEmail.lastIndexOf('@')) {
      errors.contactEmail = true;
      control = false;
    }

    this.setState({errors});
    return control;
  }

  allowSubmit () {
    if (this.props.rahForm.processing) return false;
    return true;
  }

  onSubmit (e) {
    e.preventDefault && e.preventDefault();

    if (!this.checkErrors()) {
      return false;
    }

    const d = this.state.data;
    var payload = {
      title: d.title || null,
      country: d.country || null,
      date: d.date || null,
      description: d.description || null,
      topics: d.topics.length ? d.topics : null,
      authors: d.authors.length ? d.authors : null,

      contactName: d.contactName || null,
      contactEmail: d.contactEmail || null
    };

    this.props._showGlobalLoading();
    // On create we only want to send properties that were filled in.
    payload = _.pickBy(payload, v => v !== null);
    this.props._postRAHExport(this.props.projectId, payload);
  }

  componentWillUnmount () {
    this.props.resetForm();
  }

  onClose () {
    this.props.resetForm();
    this.setState(this.getInitialState());
    this.props.onCloseClick();
  }

  renderTitleField () {
    let limit = nameLimit(this.state.data.title.length);

    return (
      <BasicInput
        type='text'
        id='project__title'
        label={t('Title')}
        className={limit.c('form__control form__control--medium')}
        placeholder={t('Untitled project')}
        value={this.state.data.title}
        onChange={this.onChangeTitle}
        autoFocus
        help={<p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>} >

      {this.state.errors.title ? <p className='form__error'>{t('A valid project name is required.')}</p> : null}
      </BasicInput>
    );
  }

  renderCountryField () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='project__location'>{t('Location')}</label>
        <select name='project__location' id='project__location' className='form__control' value={this.state.data.country} onChange={this.onChangeCountry}>
          <option>{t('Select a country')}</option>
          {countries.map(c => <option key={c.code} value={c.name}>{t(c.name)}</option>)}
        </select>

        {this.state.errors.country ? <p className='form__error'>{t('A country is required')}</p> : null}
      </div>
    );
  }

  renderDateField () {
    return (
      <BasicInput
        type='date'
        id='project__date'
        label={t('Date')}
        placeholder={t('Select a date')}
        value={this.state.data.date}
        onChange={this.onChangeDate} >
        {this.state.errors.date ? <p className='form__error'>{t('A valid date is required.')}</p> : null}
      </BasicInput>
    );
  }

  renderTopicsField () {
    return (
      <TagsInput
        id='project__topics'
        title={t('Topics')}
        placeholder={t('Give it one or more topics. E.g. "road upgrade"')}
        suggestionsUrl={'https://gist.githubusercontent.com/danielfdsilva/91a55a6c50bc1a8e8ac2d42ba2c6f16f/raw/7532c1a1723009e8c268c8b5dee8172175f371ae/topics.json'}
        tags={this.state.data.topics}
        onChange={this.onChangeTopics} >
        {this.state.errors.topics ? <p className='form__error'>{t('At least one topic is required.')}</p> : null}
      </TagsInput>
    );
  }

  renderAuthorsField () {
    return (
      <TagsInput
        id='project__authors'
        title={t('Authors')}
        placeholder={t('Who created this?')}
        suggestionsUrl={'https://gist.githubusercontent.com/danielfdsilva/91a55a6c50bc1a8e8ac2d42ba2c6f16f/raw/7532c1a1723009e8c268c8b5dee8172175f371ae/topics.json'}
        tags={this.state.data.authors}
        onChange={this.onChangeAuthors} >
        {this.state.errors.authors ? <p className='form__error'>{t('At least one author is required.')}</p> : null}
      </TagsInput>
    );
  }

  renderDescriptionField () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='project__description'>{t('Description')}</label>
        <textarea id='project__description' name='project__description' rows='4' className='form__control' placeholder={t('Say something about this project')} value={this.state.data.description} onChange={this.onFieldChange.bind(this, 'description')}></textarea>
        <p className='form__help'>{t('Markdown is allowed.')} <a href='https://daringfireball.net/projects/markdown/syntax' title={t('Learn more')} target='_blank'>{t('What is this?')}</a></p>
        {this.state.errors.description ? <p className='form__error'>{t('A description is required')}</p> : null}
      </div>
    );
  }

  renderContactFieldset () {
    return (
      <fieldset className='form__fieldset'>
        <legend className='form__legend'>{t('Contact person')}</legend>

        <div className='form__hascol form__hascol--2'>
          <BasicInput
            type='text'
            id='contact-person__name'
            label={t('Name')}
            placeholder={t('Tell us who you are')}
            value={this.state.data.contactName}
            onChange={this.onChangeContactName} >
            {this.state.errors.contactName ? <p className='form__error'>{t('A valid name is required.')}</p> : null}
            </BasicInput>

          <BasicInput
            type='email'
            id='contact-person__email'
            label={t('Email')}
            placeholder={t('Let’s connect')}
            value={this.state.data.contactEmail}
            onChange={this.onChangeContactEmail} >
            {this.state.errors.contactEmail ? <p className='form__error'>{t('A valid email is required.')}</p> : null}
            </BasicInput>
        </div>

        <div className='form__note'>
          <p>{t('Note that your information will become public.')}</p>
        </div>
      </fieldset>
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

              {this.renderTitleField()}

              <div className='form__hascol form__hascol--2'>
                {this.renderDateField()}
                {this.renderCountryField()}
              </div>

              {this.renderTopicsField()}
              {this.renderDescriptionField()}

              {this.renderAuthorsField()}
            </fieldset>

            {this.renderContactFieldset()}
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
  _showGlobalLoading: T.func,
  _hideGlobalLoading: T.func,
  _showAlert: T.func,
  _postRAHExport: T.func,
  resetForm: T.func,
  revealed: T.bool,
  projectId: T.string,
  rahForm: T.object,
  onCloseClick: T.func
};

export default ProjectExportModal;

import { fetchJSON } from '../../actions/';

class TagsInput extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {
      suggestions: []
    };
  }

  componentDidMount () {
    fetchJSON(this.props.suggestionsUrl)
      .then(data => {
        this.setState({suggestions: data});
      });
  }

  handleDeleteTag (i) {
    const tags = this.props.tags.slice(0);
    tags.splice(i, 1);
    this.props.onChange(tags);
  }

  handleAddTag (tag) {
    const tags = [].concat(this.props.tags, tag);
    this.props.onChange(tags);
  }

  render () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor={this.props.id}>{this.props.title}</label>
        <ReactTags
          tags={this.props.tags}
          suggestions={this.state.suggestions}
          placeholder={this.props.placeholder}
          delimiterChars={[',', ', ']}
          allowNew
          handleDelete={this.handleDeleteTag.bind(this)}
          handleAddition={this.handleAddTag.bind(this)} />
          autoresize={true}
          autofocus={false}
        <p className='form__help'>{t('Use comma or enter to separate items')}</p>
        {this.props.children}
      </div>
    );
  }
}

TagsInput.propTypes = {
  tags: T.array,
  id: T.string,
  title: T.string,
  placeholder: T.string,
  suggestionsUrl: T.string,
  children: T.node,
  onChange: T.func
};

class BasicInput extends React.PureComponent {
  render () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor={this.props.id}>{this.props.label}</label>
        <input
          type={this.props.type}
          id={this.props.id}
          name={this.props.id}
          className={this.props.className || 'form__control'}
          placeholder={this.props.placeholder}
          value={this.props.value}
          onChange={this.props.onChange}
          autoFocus={this.props.autoFocus} />

        {this.props.help}
        {this.props.children}
      </div>
    );
  }
}

BasicInput.propTypes = {
  type: T.string,
  id: T.string,
  title: T.string,
  label: T.string,
  className: T.string,
  placeholder: T.string,
  value: T.string,
  autoFocus: T.bool,
  onChange: T.func,
  help: T.node,
  children: T.node
};
