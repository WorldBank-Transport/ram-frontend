'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory, Link } from 'react-router';
import { connect } from 'react-redux';

import {
  invalidateProjectItem,
  fetchProjectItem,
  patchProject,
  deleteProject,
  showGlobalLoading,
  hideGlobalLoading
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { getLanguage } from '../utils/i18n';

import Breadcrumb from '../components/breadcrumb';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';

var ProjectPageActive = React.createClass({
  displayName: 'ProjectPageActive',

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _patchProject: T.func,
    _deleteProject: T.func,
   _showGlobalLoading: T.func,
   _hideGlobalLoading: T.func,

    params: T.object,
    project: T.object,
    projectForm: T.object
  },

  getInitialState: function () {
    return {
      projectFormModal: false
    };
  },

  closeModal: function () {
    this.setState({projectFormModal: false});
  },

  onProjectAction: function (what, event) {
    event.preventDefault();

    switch (what) {
      case 'edit':
        this.setState({projectFormModal: true});
        break;
      case 'delete':
        this.props._showGlobalLoading();
        this.props._deleteProject(this.props.params.projectId);
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  componentDidMount: function () {
    this.props._showGlobalLoading();
    this.props._fetchProjectItem(this.props.params.projectId);
  },

  componentWillUnmount: function () {
    this.props._invalidateProjectItem();
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.props._hideGlobalLoading();
    }

    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    if (!this.props.project.fetched && nextProps.project.fetched) {
      // Project just fetched. Validate status;
      if (nextProps.project.data.status === 'pending') {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}/setup`);
      }
    }

    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.props._fetchProjectItem(nextProps.params.projectId);
    }

    if (this.props.projectForm.action === 'delete' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing) {
      this.props._hideGlobalLoading();
      if (nextProps.projectForm.error) {
        return hashHistory.push(`/${getLanguage()}/projects`);
      }
    }
  },

  render: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.project;

    if (!fetched && !fetching) {
      return null;
    }

    // Show if it's the first loading time.
    if (!receivedAt && fetching) {
      return null;
    }

    if (error) {
      return <div>Error: {prettyPrint(error)}</div>;
    }

    return (
      <section className='inpage inpage--hub'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <Breadcrumb />
              <h1 className='inpage__title'>{data.name}</h1>
            </div>
            <ProjectHeaderActions
              project={data}
              onAction={this.onProjectAction} />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <section className='diptych diptych--info'>
              <h2 className='diptych__title'>Description</h2>
              <div className='prose'>
                <p>Lorem ipsum dolor sit amet description.</p>
              </div>

              <h2 className='diptych__title'>Data</h2>
              <dl>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
              </dl>

              {prettyPrint(data)}
            </section>

            <section className='diptych diptych--scenarios'>
              <h2 className='diptych__title'>Scenarios</h2>

              <ol className='card-list scenarios-card-list'>
                <li>
                  <article className='scenario scenario--card card' id={`scenario-1234`}>
                    <div className='card__contents'>
                      <header className='card__header'>
                        <div className='card__headline'>
                          <Link to='' title='View scenario' className='link-wrapper'>
                            <h1 className='card__title'>Scenario title</h1>
                          </Link>
                          <p className='card__subtitle'>Scenario subtitle</p>
                        </div>
                      </header>
                      <div className='card__body'>
                        <div className='card__summary'>
                          <p>Lorem ipsum dolor sit amet description.</p>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
                <li>
                  <button className='card__button card__button--add'><span>New scenario</span></button>
                </li>
              </ol>
            </section>

          </div>
        </div>

        <ProjectFormModal
          editing
          _showGlobalLoading={this.props._showGlobalLoading}
          _hideGlobalLoading={this.props._hideGlobalLoading}
          revealed={this.state.projectFormModal}
          onCloseClick={this.closeModal}
          projectForm={this.props.projectForm}
          projectData={data}
          saveProject={this.props._patchProject}
        />

      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    project: state.projectItem,
    scenario: state.scenarioItem,
    projectForm: state.projectForm
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _patchProject: (...args) => dispatch(patchProject(...args)),
    _deleteProject: (...args) => dispatch(deleteProject(...args)),
    _showGlobalLoading: (...args) => dispatch(showGlobalLoading(...args)),
    _hideGlobalLoading: (...args) => dispatch(hideGlobalLoading(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPageActive);
