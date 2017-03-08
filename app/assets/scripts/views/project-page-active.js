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
  hideGlobalLoading,
  fetchProjectScenarios,
  resetProjectFrom
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import { fileTypesMatrix } from '../utils/constants';
import config from '../config';

import Breadcrumb from '../components/breadcrumb';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';

var ProjectPageActive = React.createClass({

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _patchProject: T.func,
    _deleteProject: T.func,
    _resetProjectFrom: T.func,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,
    _fetchProjectScenarios: T.func,

    params: T.object,
    project: T.object,
    scenarios: T.object,
    projectForm: T.object
  },

  getInitialState: function () {
    return {
      projectFormModal: false
    };
  },

  // Flag variables to wait for the project and scenario to load.
  projectLoaded: false,
  scenarioLoaded: false,
  loadingVisible: false,

  showLoading: function () {
    this.loadingVisible = true;
    this.props._showGlobalLoading();
  },

  hideLoading: function () {
    this.loadingVisible = false;
    this.props._hideGlobalLoading();
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
        this.showLoading();
        this.props._deleteProject(this.props.params.projectId);
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  componentDidMount: function () {
    this.projectLoaded = false;
    this.scenarioLoaded = false;
    this.showLoading();
    this.props._fetchProjectItem(this.props.params.projectId);
    this.props._fetchProjectScenarios(this.props.params.projectId);
  },

  componentWillUnmount: function () {
    this.props._invalidateProjectItem();
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.projectLoaded = true;
    }
    if (this.props.scenarios.fetching && !nextProps.scenarios.fetching) {
      this.scenarioLoaded = true;
    }

    if (this.projectLoaded && this.scenarioLoaded) {
      this.hideLoading();
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
      this.projectLoaded = false;
      this.scenarioLoaded = false;
      this.showLoading();
      this.props._fetchProjectItem(nextProps.params.projectId);
      this.props._fetchProjectScenarios(this.props.params.projectId);
    }

    if (this.props.projectForm.action === 'delete' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing) {
      this.hideLoading();
      if (nextProps.projectForm.error) {
        return hashHistory.push(`/${getLanguage()}/projects`);
      }
    }
  },

  renderFiles: function () {
    let projectFiles = this.props.project.data.files;
    let projectId = this.props.project.data.id;

    return (
      <dl>
        {projectFiles.map(file => ([
          <dt key={`${file.name}-label`}>{fileTypesMatrix[file.type].display}</dt>,
          <dd key={`${file.name}-desc`}>{fileTypesMatrix[file.type].description}</dd>,
          <dd key={`${file.name}-down`}><a href={`${config.api}/projects/${projectId}/files/${file.id}`} title={t('Download file')} className='psba-download'><span>{t('Download')}</span></a></dd>
        ]))}
      </dl>
    );
  },

  renderScenarioCard: function (scenario) {
    let {id, project_id: projectId, name, description} = scenario;

    return (
      <li key={`scenario-${id}`}>
        <article className='scenario scenario--card card' id={`scenario-${id}`}>
          <div className='card__contents'>
            <header className='card__header'>
              <div className='card__headline'>
                <Link to={`/projects/${projectId}/scenarios/${id}`} title={t('View scenario')} className='link-wrapper'>
                  <h1 className='card__title'>{name}</h1>
                </Link>
                <p className='card__subtitle'>Scenario subtitle</p>
              </div>
            </header>
            <div className='card__body'>
              <div className='card__summary'>
                {description ? (
                <p>{description}</p>
                ) : (
                <p>{t('No description.')}</p>
                )}
              </div>
            </div>
          </div>
        </article>
      </li>
    );
  },

  renderScenariosList: function () {
    let data = this.props.scenarios.data.results;
    return (
      <ol className='card-list scenarios-card-list'>
        {data.map(scenario => this.renderScenarioCard(scenario))}
        <li>
          <button className='card__button card__button--add'><span>{t('New scenario')}</span></button>
        </li>
      </ol>
    );
  },
  render: function () {
    let { fetched: fetchedProject, fetching: fetchingProject, error: errorProject, data: dataProject } = this.props.project;
    let { fetched: fetchedScenario, fetching: fetchingScenario, error: errorScenario } = this.props.scenarios;

    let fetched = fetchedProject && fetchedScenario;
    let fetching = fetchingProject && fetchingScenario;
    let error = errorProject || errorScenario;

    if (!fetched && !fetching || !fetched && fetching) {
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
              <h1 className='inpage__title'>{dataProject.name}</h1>
            </div>
            <ProjectHeaderActions
              project={dataProject}
              onAction={this.onProjectAction} />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <section className='diptych diptych--info'>
              {dataProject.description ? <h2 className='diptych__title'>{t('Description')}</h2> : null}
              {dataProject.description ? (
                <div className='prose'>
                  <p>{dataProject.description}</p>
                </div>
              ) : null}

              <h2 className='diptych__title'>{t('Data')}</h2>
              {this.renderFiles()}

            </section>

            <section className='diptych diptych--scenarios'>
              <h2 className='diptych__title'>{t('Scenarios')}</h2>
              {this.renderScenariosList()}
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
          projectData={dataProject}
          saveProject={this.props._patchProject}
          resetForm={this.props._resetProjectFrom}
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
    scenarios: state.scenarios,
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
    _hideGlobalLoading: (...args) => dispatch(hideGlobalLoading(...args)),
    _fetchProjectScenarios: (...args) => dispatch(fetchProjectScenarios(...args)),
    _resetProjectFrom: (...args) => dispatch(resetProjectFrom(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPageActive);
