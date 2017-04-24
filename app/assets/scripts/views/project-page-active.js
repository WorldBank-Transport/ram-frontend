'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';

import {
  invalidateProjectItem,
  fetchProjectItem,
  patchProject,
  deleteProject,
  fetchProjectScenarios,
  resetProjectFrom,
  resetScenarioFrom,
  postScenario,
  deleteScenario
} from '../actions';
import { prettyPrint, fetchStatus } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import { fileTypesMatrix } from '../utils/constants';
import config from '../config';
import { showGlobalLoading, hideGlobalLoading } from '../components/global-loading';

import Breadcrumb from '../components/breadcrumb';
import Dropdown from '../components/dropdown';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';
import ScenarioCreateModal from '../components/scenario/scenario-create-modal';
import ScenarioDeleteAction from '../components/scenario/scenario-delete-action';

var ProjectPageActive = React.createClass({

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _patchProject: T.func,
    _deleteProject: T.func,
    _resetProjectFrom: T.func,
    _resetScenarioFrom: T.func,
    _fetchProjectScenarios: T.func,
    _deleteScenario: T.func,
    _postScenario: T.func,

    params: T.object,
    project: T.object,
    scenarios: T.object,
    projectForm: T.object,
    scenarioForm: T.object
  },

  getInitialState: function () {
    return {
      projectFormModal: false,
      scenarioCreateModal: false
    };
  },

  // Flag variables to wait for the project and scenario to load.
  projectLoaded: false,
  scenarioLoaded: false,
  loadingVisible: false,

  showLoading: function () {
    this.loadingVisible = true;
    showGlobalLoading();
  },

  hideLoading: function () {
    this.loadingVisible = false;
    hideGlobalLoading();
  },

  closeModal: function (what) {
    switch (what) {
      case 'project-form':
        this.setState({projectFormModal: false});
        break;
      case 'new-scenario':
        this.setState({scenarioCreateModal: false});
        break;
    }
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
      case 'new-scenario':
        this.setState({scenarioCreateModal: true});
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  onScenarioDelete: function (scenario) {
    this.showLoading();
    this.props._deleteScenario(scenario.project_id, scenario.id);
  },

  checkAllLoaded: function (nextProps) {
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.projectLoaded = true;
    }
    if (this.props.scenarios.fetching && !nextProps.scenarios.fetching) {
      this.scenarioLoaded = true;
    }

    if (this.projectLoaded && this.scenarioLoaded && this.loadingVisible) {
      this.hideLoading();
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
    this.checkAllLoaded(nextProps);

    // Not found.
    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      this.hideLoading();
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    if (!this.props.project.fetched && nextProps.project.fetched) {
      // Project just fetched. Validate status;
      if (nextProps.project.data.status === 'pending') {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}/setup`);
      }
    }

    // Url has changed.
    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.projectLoaded = false;
      this.scenarioLoaded = false;
      this.showLoading();
      this.props._fetchProjectItem(nextProps.params.projectId);
      this.props._fetchProjectScenarios(this.props.params.projectId);
      return;
    }

    // Delete action has finished.
    if (this.props.projectForm.action === 'delete' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing) {
      this.hideLoading();
      if (!nextProps.projectForm.error) {
        return hashHistory.push(`/${getLanguage()}/projects`);
      }
    }

    // Delete action has finished.
    if (this.props.scenarioForm.action === 'delete' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
      if (!nextProps.scenarioForm.error) {
        console.log('scenario deleted');
        this.props._fetchProjectScenarios(this.props.params.projectId);
      } else {
        this.hideLoading();
      }
    }
  },

  renderFiles: function () {
    let projectFiles = this.props.project.data.files;
    let projectId = this.props.project.data.id;

    return projectFiles.map(file => ([
      <li>
        <div className={`project-detail ${file.type}`}>
          <h3 className='project-detail__title' key={`${file.name}-label`}>{fileTypesMatrix[file.type].display}</h3>
          <p className='action-wrapper'><a href={`${config.api}/projects/${projectId}/files/${file.id}`} title={t('Download file')} className='detail-download'><span>{t('Download')}</span></a></p>
          <p key={`${file.name}-desc`}>{fileTypesMatrix[file.type].description}</p>
        </div>
      </li>
    ]));
  },

  renderScenarioCard: function (scenario) {
    let {id, project_id: projectId, name, description, master: isMaster} = scenario;

    return (
      <li key={`scenario-${id}`}>
        <article className='scenario scenario--card card' id={`scenario-${id}`}>
          <div className='card__contents'>
            <header className='card__header'>
              <div className='card__headline'>
                <Link to={`/${getLanguage()}/projects/${projectId}/scenarios/${id}`} title={t('View scenario')} className='link-wrapper'>
                  <h1 className='card__title'>{name}</h1>
                </Link>
                <p className='card__subtitle'>Scenario subtitle</p>
              </div>
              <div className='card__actions'>
                <Dropdown
                  onChange={(open) => open ? ReactTooltip.rebuild() : ReactTooltip.hide()}
                  className='scenario-meta-menu'
                  triggerClassName='ca-ellipsis'
                  triggerActiveClassName='button--active'
                  triggerText='Options'
                  triggerTitle='Scenario options'
                  direction='down'
                  alignment='right' >
                    <ul className='drop__menu drop__menu--iconified' role='menu'>
                      <li><a href='#' title={t('Duplicate scenario')} className='drop__menu-item dmi-copy' data-hook='dropdown:close'>{t('Duplicate scenario')}</a></li>
                    </ul>
                    <ul className='drop__menu drop__menu--iconified' role='menu'>
                      <li><ScenarioDeleteAction isMaster={isMaster} name={name} onDeleteConfirm={this.onScenarioDelete.bind(null, scenario)}/></li>
                    </ul>
                </Dropdown>
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
          <button className='card__button card__button--add' onClick={() => this.setState({scenarioCreateModal: true})}><span>{t('New scenario')}</span></button>
        </li>
      </ol>
    );
  },

  renderBreadcrumb: function () {
    const items = [
      {
        path: '/projects',
        title: t('Visit projects page'),
        value: t('Projects')
      }
    ];
    return (
      <Breadcrumb items={items}/>
    );
  },

  render: function () {
    const { fetched, fetching, error } = fetchStatus(this.props.project, this.props.scenarios);
    const dataProject = this.props.project.data;

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
              {this.renderBreadcrumb()}
              <h1 className='inpage__title'>{dataProject.name}</h1>
            </div>
            <ProjectHeaderActions
              project={dataProject}
              projectStatus='active'
              onAction={this.onProjectAction} />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <section className='diptych diptych--info'>

              <h2 className='diptych__title'>{t('Details')}</h2>
              <div className='card'>
                <div className='card__contents'>
                  <ul className='project-details-list'>
                    <li>
                      <div className='project-detail description'>
                        {dataProject.description ? <h3 className='project-detail__title'>{t('Description')}</h3> : null}
                        {dataProject.description ? (
                          <p>{dataProject.description}</p>
                        ) : null}
                      </div>
                    </li>
                    {this.renderFiles()}
                  </ul>
                </div>
              </div>
            </section>

            <section className='diptych diptych--scenarios'>
              <h2 className='diptych__title'>{t('Scenarios')}</h2>
              {this.renderScenariosList()}
            </section>

          </div>
        </div>

        <ProjectFormModal
          editing
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          revealed={this.state.projectFormModal}
          onCloseClick={this.closeModal.bind(null, 'project-form')}
          projectForm={this.props.projectForm}
          projectData={dataProject}
          saveProject={this.props._patchProject}
          resetForm={this.props._resetProjectFrom}
        />

        <ScenarioCreateModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          revealed={this.state.scenarioCreateModal}
          onCloseClick={this.closeModal.bind(null, 'new-scenario')}
          scenarioForm={this.props.scenarioForm}
          scenarioList={this.props.scenarios.data.results}
          projectId={this.props.params.projectId}
          saveScenario={this.props._postScenario}
          resetForm={this.props._resetScenarioFrom}
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
    projectForm: state.projectForm,
    scenarioForm: state.scenarioForm
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _patchProject: (...args) => dispatch(patchProject(...args)),
    _deleteProject: (...args) => dispatch(deleteProject(...args)),
    _fetchProjectScenarios: (...args) => dispatch(fetchProjectScenarios(...args)),
    _resetProjectFrom: (...args) => dispatch(resetProjectFrom(...args)),
    _resetScenarioFrom: (...args) => dispatch(resetScenarioFrom(...args)),
    _deleteScenario: (...args) => dispatch(deleteScenario(...args)),
    _postScenario: (...args) => dispatch(postScenario(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPageActive);
