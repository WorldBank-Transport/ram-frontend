'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';
import ReactTags from 'react-tag-autocomplete';
import ReactTooltip from 'react-tooltip';

import { t } from '../../utils/i18n';
import { limitHelper } from '../../utils/utils';
import countries from '../../utils/countries';
import { rahUrl } from '../../config';

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
    this.onChangeIncludeResults = this.onChangeIncludeResults.bind(this);
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
        includeResults: this.hasResults(),

        contactName: '',
        contactEmail: ''
      }
    };
  }

  hasResults () {
    // Check if there are results by checking if the analysis succeded for each
    // of the project scenarios.
    // Note: The scenario api returns paginated results. It is theoretically
    // possible that different pages have different results but in pratice this
    // is unlikely to be a problem because there are never that many scenarios.
    return this.props.scenarios.some(sc => sc.gen_analysis &&
      sc.gen_analysis.status === 'complete' &&
      !sc.gen_analysis.errored);
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
    const data = Object.assign({}, this.state.data, {[field]: val});
    this.setState({data});
  }

  onChangeIncludeResults (e) {
    const prev = this.state.data.includeResults;
    this.onFieldChange('includeResults', !prev);
  }

  checkErrorField (field, setState = true) {
    const errors = this.state.errors;
    let control = true;
    switch (field) {
      case 'title':
        const title = this.state.data.title;
        if (title.length === 0 || !nameLimit(title.length).isOk()) {
          control = false;
        }
        break;
      case 'country':
      case 'description':
      case 'date':
      case 'topics':
      case 'authors':
      case 'contactName':
        if (!this.state.data[field].length) {
          control = false;
        }
        break;
      case 'contactEmail':
        const contactEmail = this.state.data.contactEmail;
        const atPos = contactEmail.indexOf('@');
        if (atPos === -1 || atPos !== contactEmail.lastIndexOf('@')) {
          control = false;
        }
        break;
      case 'includeResults':
        // Whatever is fine
        control = true;
        break;
    }

    if (setState) {
      this.setState({errors: Object.assign({}, errors, {[field]: !control})});
    }

    return control;
  }

  allowSubmit () {
    if (this.props.rahForm.processing) return false;

    // Check errors.
    const fields = Object.keys(this.state.data);
    return fields.every(f => this.checkErrorField(f, false));
  }

  onSubmit (e) {
    e.preventDefault && e.preventDefault();

    // Check errors.
    const fields = Object.keys(this.state.data);

    if (!fields.every(f => this.checkErrorField(f))) {
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
      includeResults: d.includeResults,

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
        onBlur={this.checkErrorField.bind(this, 'title')}
        hasError={this.state.errors.title}
        autoFocus
        help={<p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>} />
    );
  }

  renderCountryField () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='project__location'>{t('Location')}</label>
        <select
          name='project__location'
          id='project__location'
          className={c('form__control', {'form__control--danger': this.state.errors.country})}
          value={this.state.data.country}
          onChange={this.onChangeCountry}
          onBlur={this.checkErrorField.bind(this, 'country')} >
          <option value=''>{t('Select a country')}</option>
          {countries.map(c => <option key={c.code} value={c.code}>{t(c.name)}</option>)}
        </select>
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
        onChange={this.onChangeDate}
        onBlur={this.checkErrorField.bind(this, 'date')}
        hasError={this.state.errors.date} />
    );
  }

  renderTopicsField () {
    return (
      <TagsInput
        id='project__topics'
        title={t('Topics')}
        placeholder={!this.state.data.topics.length ? t('Give it one or more topics. E.g. "road upgrade"') : ''}
        suggestionsUrl={`${rahUrl}/assets/content/topics.json`}
        tags={this.state.data.topics}
        onChange={this.onChangeTopics}
        onBlur={this.checkErrorField.bind(this, 'topics')}
        hasError={this.state.errors.topics} />
    );
  }

  renderAuthorsField () {
    return (
      <TagsInput
        id='project__authors'
        title={t('Authors')}
        placeholder={!this.state.data.authors.length ? t('Who created this?') : ''}
        suggestionsUrl={`${rahUrl}/assets/content/authors.json`}
        tags={this.state.data.authors}
        onChange={this.onChangeAuthors}
        onBlur={this.checkErrorField.bind(this, 'authors')}
        hasError={this.state.errors.authors} />
    );
  }

  renderDescriptionField () {
    return (
      <div className='form__group'>
        <label className='form__label' htmlFor='project__description'>{t('Description')}</label>
        <textarea
          id='project__description'
          name='project__description'
          rows='4'
          className={c('form__control', {'form__control--danger': this.state.errors.description})}
          placeholder={t('Say something about this project')}
          value={this.state.data.description}
          onChange={this.onFieldChange.bind(this, 'description')}
          onBlur={this.checkErrorField.bind(this, 'description')}>
        </textarea>
        <p className='form__help'>{t('Markdown is allowed.')} <a href='https://daringfireball.net/projects/markdown/syntax' title={t('Learn more')} target='_blank'>{t('What is this?')}</a></p>
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
            onChange={this.onChangeContactName}
            onBlur={this.checkErrorField.bind(this, 'contactName')}
            hasError={this.state.errors.contactName} />

          <BasicInput
            type='email'
            id='contact-person__email'
            label={t('Email')}
            placeholder={t('Let’s connect')}
            value={this.state.data.contactEmail}
            onChange={this.onChangeContactEmail}
            onBlur={this.checkErrorField.bind(this, 'contactEmail')}
            hasError={this.state.errors.contactEmail} />
        </div>

        <div className='form__note'>
          <p>{t('Note that your information will become public.')}</p>
        </div>
      </fieldset>
    );
  }

  renderIncludeResultsToggle () {
    const hasResults = this.hasResults();
    const labelProps = {
      className: c('form__option form__option--switch option fos-io', {'visually-disabled': !hasResults}),
      'data-tip': t('This project doesn\'t have results to export'),
      'data-tip-disable': hasResults,
      'data-effect': 'solid'
    };

    return (
      <label htmlFor='include-results' title={t('Toggle export results')} {...labelProps}>
        <input name='include-results' id='include-results' value='includeResults' type='checkbox' checked={this.hasResults() && this.state.data.includeResults} onChange={this.onChangeIncludeResults}/>
        <span className='form__option__ui'></span><span className='form__option__text'>{t('Export results')}</span>
      </label>
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

              <ReactTooltip />

              {this.renderTitleField()}

              <div className='form__hascol form__hascol--2'>
                {this.renderDateField()}
                {this.renderCountryField()}
              </div>

              {this.renderTopicsField()}
              {this.renderDescriptionField()}

              {this.renderAuthorsField()}

              {this.renderIncludeResultsToggle()}
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
  scenarios: T.array,
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

    this.handleBlur = this.handleBlur.bind(this);
    this.handleDeleteTag = this.handleDeleteTag.bind(this);
    this.handleAddTag = this.handleAddTag.bind(this);

    this.reactTags = null;
  }

  componentDidMount () {
    fetchJSON(this.props.suggestionsUrl)
      .then(data => {
        this.setState({suggestions: data});
      });
  }

  handleBlur () {
    const tag = this.reactTags.state.query;
    if (tag) {
      this.reactTags.addTag({name: tag});
    }
    // Allow state to reconvile before firing the event.
    setTimeout(() => { this.props.onBlur(); }, 1);
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
          ref={el => { this.reactTags = el; }}
          classNames={{root: c('react-tags', {'form__control--danger': this.props.hasError})}}
          tags={this.props.tags}
          suggestions={this.state.suggestions}
          placeholder={this.props.placeholder}
          delimiterChars={[',', ', ']}
          allowNew
          autoresize={true}
          autofocus={false}
          handleBlur={this.handleBlur}
          handleDelete={this.handleDeleteTag}
          handleAddition={this.handleAddTag} />
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
  hasError: T.bool,
  children: T.node,
  onChange: T.func,
  onBlur: T.func
};

class BasicInput extends React.PureComponent {
  render () {
    const classNames = c(this.props.className || 'form__control', {
      'form__control--danger': this.props.hasError
    });

    return (
      <div className='form__group'>
        <label className='form__label' htmlFor={this.props.id}>{this.props.label}</label>
        <input
          type={this.props.type}
          id={this.props.id}
          name={this.props.id}
          className={classNames}
          placeholder={this.props.placeholder}
          value={this.props.value}
          onChange={this.props.onChange}
          onBlur={this.props.onBlur}
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
  hasError: T.bool,
  onChange: T.func,
  onBlur: T.func,
  help: T.node,
  children: T.node
};
