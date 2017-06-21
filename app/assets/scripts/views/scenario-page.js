'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';
import TimeAgo from 'timeago-react';

import {
  invalidateProjectItem,
  deleteScenario,
  patchScenario,
  duplicateScenario,
  resetScenarioFrom,
  fetchProjectItem,
  invalidateScenarioItem,
  fetchScenarioItem,
  startGenerateResults,
  // Fetch scenario without indication of loading.
  fetchScenarioItemSilent,
  fetchScenarioResults,
  showAlert,
  abortGenerateResults
} from '../actions';
import { fetchStatus, scenarioHasResults } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import { showGlobalLoading, hideGlobalLoading } from '../components/global-loading';

import Breadcrumb from '../components/breadcrumb';
import ScenarioHeaderActions from '../components/scenario/scenario-header-actions';
import ScenarioEditModal from '../components/scenario/scenario-edit-modal';
import ScenarioGenSettingsModal from '../components/scenario/scenario-generation-settings-modal';
import ScenarioIDModal from '../components/scenario/scenario-id-modal';
import Alert from '../components/alert';
import LogBase from '../components/log-base';
import ScenarioResults from '../components/scenario/scenario-results';
import StickyHeader from '../components/sticky-header';
import FatalError from '../components/fatal-error';

const ScenarioPage = React.createClass({
  propTypes: {
    params: T.object,
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _invalidateScenarioItem: T.func,
    _fetchScenarioItem: T.func,
    _deleteScenario: T.func,
    _patchScenario: T.func,
    _duplicateScenario: T.func,
    _resetScenarioFrom: T.func,
    _startGenerateResults: T.func,
    _fetchScenarioItemSilent: T.func,
    _fetchScenarioResults: T.func,
    _showAlert: T.func,
    _abortGenerateResults: T.func,

    scenario: T.object,
    project: T.object,
    scenarioForm: T.object
  },

  getInitialState: function () {
    return {
      scenarioEditMetadataModal: false,
      scenarioGenSettingsModal: false,
      scenarioIDModal: false
    };
  },

  // Flag variables to wait for the project and scenario to load.
  elementsLoaded: 0,
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
      case 'edit-scenario':
        this.setState({scenarioEditMetadataModal: false});
        break;
      case 'generate-settings':
        this.setState({scenarioGenSettingsModal: false});
        break;
      case 'edit-network':
        this.setState({scenarioIDModal: false});
        this.props._fetchScenarioItemSilent(this.props.params.projectId, this.props.params.scenarioId);
        break;
    }
  },

  checkAllLoaded: function (nextProps) {
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.elementsLoaded++;
    }
    if (this.props.scenario.fetching && !nextProps.scenario.fetching) {
      this.elementsLoaded++;
    }

    if (this.elementsLoaded === 2 && this.loadingVisible) {
      // Done.
      this.elementsLoaded = 0;
      this.hideLoading();
    }
  },

  componentDidMount: function () {
    this.projectLoaded = false;
    this.scenarioLoaded = false;
    this.showLoading();
    this.props._fetchProjectItem(this.props.params.projectId);
    this.props._fetchScenarioItem(this.props.params.projectId, this.props.params.scenarioId);
  },

  componentWillUnmount: function () {
    this.hideLoading();
    this.props._invalidateScenarioItem();
    this.props._invalidateProjectItem();
  },

  componentWillReceiveProps: function (nextProps) {
    this.checkAllLoaded(nextProps);

    // Not found.
    var error = nextProps.scenario.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      this.hideLoading();
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    // Url has changed.
    if (this.props.params.projectId !== nextProps.params.projectId ||
      this.props.params.scenarioId !== nextProps.params.scenarioId) {
      this.projectLoaded = false;
      this.scenarioLoaded = false;
      this.showLoading();
      // Project will stay loaded, scenario needs to reload.
      this.elementsLoaded = 1;
      this.props._fetchScenarioItem(nextProps.params.projectId, nextProps.params.scenarioId);
      return;
    }

    // Delete action has finished.
    if (this.props.scenarioForm.action === 'delete' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
      this.hideLoading();
      if (!nextProps.scenarioForm.error) {
        this.props._showAlert('success', <p>{t('Scenario successfully deleted')}</p>, true, 4500);
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}`);
      } else {
        this.props._showAlert('danger', <p>{t('An error occurred while deleting the scenario')}</p>, true);
      }
    }

    // Scenario duplicate.
    if (!this.state.scenarioEditMetadataModal &&
        !this.state.scenarioGenSettingsModal &&
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

    let genResults = this.props.scenario.genResults;
    let nextGenResults = nextProps.scenario.genResults;
    if (genResults.processing && !nextGenResults.processing) {
      this.hideLoading();
      this.props._fetchScenarioItemSilent(this.props.params.projectId, this.props.params.scenarioId);
      if (nextGenResults.error) {
        alert(nextGenResults.error.message);
      }
    }
  },

  onScenarioDuplicate: function () {
    this.showLoading();
    this.props._duplicateScenario(this.props.params.projectId, this.props.params.scenarioId);
  },

  onScenarioAction: function (what, event) {
    event.preventDefault();

    switch (what) {
      case 'edit-metadata':
        this.setState({scenarioEditMetadataModal: true});
        break;
      case 'generate':
        this.setState({scenarioGenSettingsModal: true});
        break;
      case 'edit-network':
        this.setState({scenarioIDModal: true});
        break;
      case 'duplicate':
        this.onScenarioDuplicate();
        break;
      case 'delete':
        this.showLoading();
        this.props._deleteScenario(this.props.params.projectId, this.props.params.scenarioId);
        break;
      case 'abort':
        this.showLoading();
        this.props._abortGenerateResults(this.props.params.projectId, this.props.params.scenarioId, () => this.hideLoading());
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  renderBreadcrumb: function () {
    const project = this.props.project.data;
    const items = [
      {
        path: '/projects',
        title: t('Visit projects page'),
        value: t('Projects')
      },
      {
        path: `/projects/${project.id}`,
        title: t('Visit project {name}', {name: project.name}),
        value: project.name
      }
    ];
    return (
      <Breadcrumb items={items}/>
    );
  },

  renderOutdatedResultsMessage: function () {
    let scenario = this.props.scenario.data;
    let isGenerating = scenario.gen_analysis && scenario.gen_analysis.status === 'running';
    // Only show message if the scenario is active and nothing is generating.
    if (scenario.status !== 'active' || isGenerating) {
      return null;
    }

    let genAt = scenario.data.res_gen_at;
    genAt === 0 ? genAt : (new Date(genAt)).getTime();
    let rnUpdatedAt = scenario.data.rn_updated_at;
    rnUpdatedAt === 0 ? rnUpdatedAt : (new Date(rnUpdatedAt)).getTime();

    if (rnUpdatedAt > genAt) {
      return (
        <Alert type='warning'>
          <h6>{t('Outdated results')}</h6>
          <p>{t('The road network was modified. Generate the results again to ensure they reflect the road network\'s last state.')}</p>
        </Alert>
      );
    }
  },

  renderEmptyState: function () {
    let scenario = this.props.scenario.data;
    let isGenerating = scenario.gen_analysis && scenario.gen_analysis.status === 'running';
    let isPending = scenario.scen_create && scenario.scen_create.status === 'running';

    if (isGenerating || isPending || scenarioHasResults(scenario)) {
      return null;
    }

    return (
      <div className='empty-content'>
        <div className='prose prose--responsive'>
          <p>{t('There\'s no data to show yet. Please start by running analysis.')}</p>
        </div>
        <button title={t('Generate analysis')} className='card__button card__button--arrow-loop empty-content__cta' type='button' onClick={this.onScenarioAction.bind(null, 'generate')}><span>{t('Analysis')}</span></button>
      </div>
    );
  },

  render: function () {
    const { fetched, fetching, error } = fetchStatus(this.props.project, this.props.scenario);
    const dataScenario = this.props.scenario.data;

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
            <h1 className='inpage__title' title={dataScenario.name}>{dataScenario.name}</h1>
            {dataScenario.description ? (
              <p className='inpage__description'>{dataScenario.description}</p>
            ) : null}
          </div>
          <ScenarioHeaderActions
            scenario={dataScenario}
            onAction={this.onScenarioAction} />
        </StickyHeader>
        <div className='inpage__body'>
          <div className='inner'>

            {this.renderOutdatedResultsMessage()}

            <LogGen
              data={dataScenario.gen_analysis}
              receivedAt={this.props.scenario.receivedAt}
              update={this.props._fetchScenarioItemSilent.bind(null, this.props.params.projectId, this.props.params.scenarioId)}
            />

            <LogCreate
              data={dataScenario.scen_create}
              receivedAt={this.props.scenario.receivedAt}
              update={this.props._fetchScenarioItemSilent.bind(null, this.props.params.projectId, this.props.params.scenarioId)}
            />

            {this.renderEmptyState()}

            {scenarioHasResults(dataScenario) ? (
              <ScenarioResults
                projectId={dataScenario.project_id}
                scenarioId={dataScenario.id}
              />
            ) : null}

          </div>
        </div>

        <ScenarioEditModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          _showAlert={this.props._showAlert}
          revealed={this.state.scenarioEditMetadataModal}
          onCloseClick={this.closeModal.bind(null, 'edit-scenario')}
          scenarioForm={this.props.scenarioForm}
          scenarioData={dataScenario}
          saveScenario={this.props._patchScenario}
          resetForm={this.props._resetScenarioFrom}
        />

        {dataScenario.admin_areas ? (
        <ScenarioGenSettingsModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          revealed={this.state.scenarioGenSettingsModal}
          onCloseClick={this.closeModal.bind(null, 'generate-settings')}
          scenarioForm={this.props.scenarioForm}
          scenarioData={dataScenario}
          saveScenario={this.props._patchScenario}
          resetForm={this.props._resetScenarioFrom}
          genResults={this.props._startGenerateResults.bind(null, this.props.params.projectId, this.props.params.scenarioId)}
        />
        ) : null}

        <ScenarioIDModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
          revealed={this.state.scenarioIDModal}
          onCloseClick={this.closeModal.bind(null, 'edit-network')}
          scenarioData={dataScenario}
          projectBbox={this.props.project.data.bbox}
        />

      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    scenario: state.scenarioItem,
    project: state.projectItem,
    scenarioForm: state.scenarioForm
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateScenarioItem: (...args) => dispatch(invalidateScenarioItem(...args)),
    _fetchScenarioItem: (...args) => dispatch(fetchScenarioItem(...args)),
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _showGlobalLoading: (...args) => dispatch(showGlobalLoading(...args)),
    _hideGlobalLoading: (...args) => dispatch(hideGlobalLoading(...args)),
    _deleteScenario: (...args) => dispatch(deleteScenario(...args)),
    _patchScenario: (...args) => dispatch(patchScenario(...args)),
    _duplicateScenario: (...args) => dispatch(duplicateScenario(...args)),
    _resetScenarioFrom: (...args) => dispatch(resetScenarioFrom(...args)),
    _startGenerateResults: (...args) => dispatch(startGenerateResults(...args)),

    _fetchScenarioItemSilent: (...args) => dispatch(fetchScenarioItemSilent(...args)),
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args)),
    _abortGenerateResults: (...args) => dispatch(abortGenerateResults(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioPage);

class LogGen extends LogBase {
  renderLog (log) {
    switch (log.code) {
      case 'error':
        let e = typeof log.data.error === 'string' ? log.data.error : 'Unknown error';
        return (
          <Alert type='danger'>
            <h6>An error occurred while generating results<TimeAgo datetime={log.created_at} /></h6>
            <p>{e}</p>
          </Alert>
        );
      case 'start':
        return (
          <Alert type='info'>
            <h6>Generating results 1/5 <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
      case 'road-network':
        return (
          <Alert type='info'>
            <h6>Generating results 2/5 <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
      case 'osrm':
        return (
          <Alert type='info'>
            <h6>Generating results 3/5 <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
      case 'routing':
        if (log.data.message.match(/started/)) {
          return (
            <Alert type='info'>
              <h6>Generating results 4/5 <TimeAgo datetime={log.created_at} /></h6>
              <p>Processing {log.data.count} admin areas</p>
            </Alert>
          );
        } else {
          return (
            <Alert type='info'>
              <h6>Generating results 4/5 <TimeAgo datetime={log.created_at} /></h6>
              <p>{log.data.message}</p>
            </Alert>
          );
        }
      case 'routing:area':
        return (
          <Alert type='info'>
            <h6>Generating results 4/5 <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.remaining} admin areas remaining. Last processed - {log.data.adminArea}</p>
          </Alert>
        );
      case 'results:bucket':
      case 'results:files':
        return (
          <Alert type='info'>
            <h6>Generating results 5/5 <TimeAgo datetime={log.created_at} /></h6>
            <p>Finishing up...</p>
          </Alert>
        );
      case 'success':
        return (
          <Alert type='success' dismissable onDismiss={() => this.setState({stickSuccess: false})}>
            <h6>Generating results<TimeAgo datetime={log.created_at} /></h6>
            <p>Result generation complete!</p>
          </Alert>
        );
    }
  }
}

class LogCreate extends LogBase {
  renderLog (log) {
    switch (log.code) {
      case 'error':
        let e = typeof log.data.error === 'string' ? log.data.error : 'Unknown error';
        return (
          <Alert type='danger'>
            <h6>An error occurred <TimeAgo datetime={log.created_at} /></h6>
            <p>{e}</p>
          </Alert>
        );
      case 'success':
        return (
          <Alert type='success' dismissable onDismiss={this.onDismiss.bind(this)}>
            <h6>Success!<TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
      default:
        return (
          <Alert type='info'>
            <h6>Creating scenario <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
    }
  }
}
