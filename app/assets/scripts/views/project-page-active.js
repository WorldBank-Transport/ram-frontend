'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import _ from 'lodash';

import {
  invalidateProjectItem,
  fetchProjectItem,
  patchProject,
  deleteProject,
  fetchProjectScenarios,
  resetProjectFrom,
  resetScenarioFrom,
  duplicateScenario,
  deleteScenario,
  showAlert,
  startSubmitScenario,
  finishSubmitScenario,
  postRAHExport,
  resetRAHForm
} from '../actions';
import { fetchStatus } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import { showGlobalLoading, hideGlobalLoading } from '../components/global-loading';
import { getProjectStatusMatrix } from '../utils/constants';

import StickyHeader from '../components/sticky-header';
import Breadcrumb from '../components/breadcrumb';
import Dropdown from '../components/dropdown';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';
import ScenarioCreateModal from '../components/scenario/scenario-create-modal';
import ScenarioDeleteAction from '../components/scenario/scenario-delete-action';
import ProjectExportModal from '../components/project/project-export-modal';
import FatalError from '../components/fatal-error';
import PorjectSourceData from '../components/project/project-source';

const ProjectPageActive = React.createClass({

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _patchProject: T.func,
    _deleteProject: T.func,
    _resetProjectFrom: T.func,
    _resetScenarioFrom: T.func,
    _fetchProjectScenarios: T.func,
    _deleteScenario: T.func,
    _duplicateScenario: T.func,
    _showAlert: T.func,
    _startSubmitScenario: T.func,
    _finishSubmitScenario: T.func,
    _postRAHExport: T.func,
    _resetRAHForm: T.func,

    params: T.object,
    project: T.object,
    scenarios: T.object,
    projectForm: T.object,
    scenarioForm: T.object,
    rahForm: T.object
  },

  getInitialState: function () {
    return {
      projectFormModal: false,
      scenarioCreateModal: false,
      projectExportModal: false
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
      case 'export-rah':
        this.setState({projectExportModal: false});
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
      case 'export-rah':
        this.setState({projectExportModal: true});
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  onScenarioDelete: function (scenario) {
    this.showLoading();
    this.props._deleteScenario(scenario.project_id, scenario.id);
  },

  onScenarioDuplicate: function (scenario, e) {
    e.preventDefault();
    this.showLoading();
    this.props._duplicateScenario(scenario.project_id, scenario.id);
    // We will need to load the scenarios again.
    this.scenarioLoaded = false;
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
        this.props._showAlert('success', <p>{t('Project successfully deleted')}</p>, true, 4500);
        return hashHistory.push(`/${getLanguage()}/projects`);
      } else {
        this.props._showAlert('danger', <p>{t('An error occurred while deleting the project')}</p>, true);
      }
    }

    // Scenario duplicate.
    if (!this.state.scenarioCreateModal &&
        this.props.scenarioForm.action === 'edit' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
      this.hideLoading();
      if (!nextProps.scenarioForm.error) {
        this.props._showAlert('success', <p>{t('Scenario duplicated successfully')}</p>, true, 4500);
        return hashHistory.push(`${getLanguage()}/projects/${nextProps.scenarioForm.data.project_id}/scenarios/${nextProps.scenarioForm.data.id}`);
      } else {
        this.props._showAlert('danger', <p>{t('An error occurred while duplicating the scenario - {reason}', {reason: nextProps.scenarioForm.error.message})}</p>, true);
      }
    }

    // Delete action has finished.
    if (this.props.scenarioForm.action === 'delete' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
      if (!nextProps.scenarioForm.error) {
        this.props._showAlert('success', <p>{t('Scenario successfully deleted')}</p>, true, 4500);
        this.props._fetchProjectScenarios(this.props.params.projectId);
      } else {
        this.props._showAlert('danger', <p>{t('An error occurred while deleting the scenario')}</p>, true);
        this.hideLoading();
      }
    }
  },

  renderSourceData: function () {
    const projectId = this.props.project.data.id;
    return _.map(this.props.project.data.sourceData, (sourceData, key) => (
      <PorjectSourceData
        key={key}
        type={key}
        projectId={projectId}
        sourceData={sourceData}
        editable={false}
        profileSpeedCustomize={key === 'profile' && sourceData.type === 'default'} />
    ));
  },

  renderScenarioCard: function (scenario) {
    let {id, project_id: projectId, name, description, master: isMaster} = scenario;

    let scenarioSubtitle;

    if (scenario.scen_create && scenario.scen_create.status === 'running') {
      scenarioSubtitle = t('Creating scenario');
    } else if (scenario.gen_analysis && scenario.gen_analysis.status === 'running') {
      scenarioSubtitle = t('Analysis running');
    } else if (scenario.data.res_gen_at !== 0) {
      scenarioSubtitle = t('Analysis complete');

      if (scenario.data.rn_updated_at > scenario.data.res_gen_at) {
        scenarioSubtitle = t('Analysis outdated');
      }
    } else {
      scenarioSubtitle = t('No analysis yet');
    }

    return (
      <li key={`scenario-${id}`}>
        <article className='scenario scenario--card card' id={`scenario-${id}`}>
          <div className='card__contents'>
            <header className='card__header'>
              <div className='card__headline'>
                <Link to={`/${getLanguage()}/projects/${projectId}/scenarios/${id}`} title={t('View scenario')} className='link-wrapper'>
                  <h1 className='card__title'>{name}</h1>
                </Link>
                <p className='card__subtitle'>{scenarioSubtitle}</p>
              </div>
              <div className='card__actions'>
                <Dropdown
                  onChange={(open) => open ? ReactTooltip.rebuild() : ReactTooltip.hide()}
                  className='scenario-meta-menu'
                  triggerClassName='ca-ellipsis'
                  triggerActiveClassName='button--active'
                  triggerText={t('Options')}
                  triggerTitle={t('Scenario options')}
                  direction='down'
                  alignment='right' >
                    <ul className='drop__menu drop__menu--iconified' role='menu'>
                      <li><a href='#' title={t('Duplicate scenario')} className='drop__menu-item dmi-copy' data-hook='dropdown:close' onClick={this.onScenarioDuplicate.bind(null, scenario)}>{t('Duplicate scenario')}</a></li>
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
            { isMaster && (
            <footer className='card__footer'>
              <dl className='card__system-details'>
                <dt>Type</dt>
                <dd className='detail detail--type-master' data-tip={t('This is the primary scenario. It can\'t be deleted.')} data-effect='solid'>Primary</dd>
              </dl>
            </footer>
            ) }
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
      return (
        <section className='inpage inpage--hub'>
          <StickyHeader className='inpage__header' />
        </section>
      );
    }

    if (error) {
      return <FatalError />;
    }

    return (
      <section className='inpage inpage--hub'>
        <StickyHeader className='inpage__header'>
          <div className='inpage__headline'>
            {this.renderBreadcrumb()}
            <h1 className='inpage__title' title={dataProject.name}>{dataProject.name} <span className='label label--light label--success'>{getProjectStatusMatrix()[dataProject.status]}</span></h1>
            {dataProject.description ? (
              <p className='inpage__description'>{dataProject.description}</p>
            ) : null}
          </div>
          <ProjectHeaderActions
            project={dataProject}
            projectStatus='active'
            onAction={this.onProjectAction} />
        </StickyHeader>
        <div className='inpage__body'>
          <div className='inner'>

            <section className='diptych diptych--col4'>
              <h2 className='inpage__section-title'>{t('Details')}</h2>
              <div className='psb-group'>
                {this.renderSourceData()}
              </div>
            </section>

            <section className='diptych diptych--col8'>
              <h2 className='inpage__section-title'>{t('Scenarios')}</h2>
              {this.renderScenariosList()}
            </section>

          </div>
        </div>

        <ProjectFormModal
          editing
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          _showAlert={this.props._showAlert}
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
          _showAlert={this.props._showAlert}
          revealed={this.state.scenarioCreateModal}
          onCloseClick={this.closeModal.bind(null, 'new-scenario')}
          scenarioForm={this.props.scenarioForm}
          scenarioList={this.props.scenarios.data.results}
          projectId={this.props.params.projectId}
          startSubmitScenario={this.props._startSubmitScenario}
          finishSubmitScenario={this.props._finishSubmitScenario}
          resetForm={this.props._resetScenarioFrom}
        />

        <ProjectExportModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          _showAlert={this.props._showAlert}
          _postRAHExport={this.props._postRAHExport}
          revealed={this.state.projectExportModal}
          scenarios={this.props.scenarios.data.results}
          projectId={this.props.params.projectId}
          rahForm={this.props.rahForm}
          onCloseClick={this.closeModal.bind(null, 'export-rah')}
          resetForm={this.props._resetRAHForm}
        />

        <ReactTooltip />

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
    scenarioForm: state.scenarioForm,
    rahForm: state.rahForm
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
    _duplicateScenario: (...args) => dispatch(duplicateScenario(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args)),
    _startSubmitScenario: (...args) => dispatch(startSubmitScenario(...args)),
    _finishSubmitScenario: (...args) => dispatch(finishSubmitScenario(...args)),
    _postRAHExport: (...args) => dispatch(postRAHExport(...args)),
    _resetRAHForm: (...args) => dispatch(resetRAHForm(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPageActive);
