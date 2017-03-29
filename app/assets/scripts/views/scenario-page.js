'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';
import TimeAgo from 'timeago-react';

import {
  showGlobalLoading,
  hideGlobalLoading,
  invalidateProjectItem,
  deleteScenario,
  patchScenario,
  resetScenarioFrom,
  fetchProjectItem,
  invalidateScenarioItem,
  fetchScenarioItem,
  startGenerateResults,
  // Fetch scenario without indication of loading.
  fetchScenarioItemSilent
} from '../actions';
import { prettyPrint, fetchStatus } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import config from '../config';

import Breadcrumb from '../components/breadcrumb';
import ScenarioHeaderActions from '../components/scenario/scenario-header-actions';
import ScenarioEditModal from '../components/scenario/scenario-edit-modal';
import ScenarioGenSettingsModal from '../components/scenario/scenario-generation-settings-modal';

var ScenarioPage = React.createClass({
  propTypes: {
    params: T.object,
    _showGlobalLoading: T.func,
    _hideGlobalLoading: T.func,
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _invalidateScenarioItem: T.func,
    _fetchScenarioItem: T.func,
    _deleteScenario: T.func,
    _patchScenario: T.func,
    _resetScenarioFrom: T.func,
    _startGenerateResults: T.func,
    _fetchScenarioItemSilent: T.func,

    scenario: T.object,
    project: T.object,
    scenarioForm: T.object
  },

  getInitialState: function () {
    return {
      scenarioEditMetadataModal: false,
      scenarioGenSettingsModal: false
    };
  },

  // Flag variables to wait for the project and scenario to load.
  elementsLoaded: 0,
  loadingVisible: false,

  showLoading: function () {
    this.loadingVisible = true;
    this.props._showGlobalLoading();
  },

  hideLoading: function () {
    this.loadingVisible = false;
    this.props._hideGlobalLoading();
  },

  closeModal: function (what) {
    switch (what) {
      case 'edit-scenario':
        this.setState({scenarioEditMetadataModal: false});
        break;
      case 'generate-settings':
        this.setState({scenarioGenSettingsModal: false});
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
      this.props._fetchScenarioItem(nextProps.params.projectId, nextProps.params.scenarioId);
      return;
    }

    // Delete action has finished.
    if (this.props.scenarioForm.action === 'delete' &&
        this.props.scenarioForm.processing &&
        !nextProps.scenarioForm.processing) {
      this.hideLoading();
      if (!nextProps.scenarioForm.error) {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}`);
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

  onScenarioAction: function (what, event) {
    event.preventDefault();

    switch (what) {
      case 'edit-metadata':
        this.setState({scenarioEditMetadataModal: true});
        break;
      case 'generate-settings':
        this.setState({scenarioGenSettingsModal: true});
        break;
      case 'delete':
        this.showLoading();
        this.props._deleteScenario(this.props.params.projectId, this.props.params.scenarioId);
        break;
      case 'generate':
        this.showLoading();
        this.props._startGenerateResults(this.props.params.projectId, this.props.params.scenarioId);
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

  renderFiles: function () {
    let data = this.props.scenario.data;
    if (data.gen_analysis && !data.gen_analysis.error) {
      let resultFiles = data.files.filter(f => f.type === 'results');

      if (!resultFiles.length) return null;

      return (
        <div>
          <h3>Result files</h3>
          <ul>
            {resultFiles.map(o => {
              return (
                <li key={o.id}>
                  <a href={`${config.api}/projects/${data.project_id}/scenarios/${data.id}/files/${o.id}?download=true`}>{o.name}</a>
                </li>
              );
            })}
          </ul>
        </div>
      );
    } else {
      return <p>No results were generated for this scenario yet.</p>;
    }
  },

  render: function () {
    const { fetched, fetching, error } = fetchStatus(this.props.project, this.props.scenario);
    const dataScenario = this.props.scenario.data;
    const formError = this.props.scenarioForm.error;

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
              <h1 className='inpage__title'>{dataScenario.name}</h1>
            </div>
            <ScenarioHeaderActions
              scenario={dataScenario}
              onAction={this.onScenarioAction} />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            {formError ? <pre>{prettyPrint(formError)}</pre> : null}

            <Log
              data={dataScenario.gen_analysis}
              receivedAt={this.props.scenario.receivedAt}
              update={this.props._fetchScenarioItemSilent.bind(null, this.props.params.projectId, this.props.params.scenarioId)}
            />
            {this.renderFiles()}
          </div>
        </div>

        <ScenarioEditModal
          _showGlobalLoading={this.props._showGlobalLoading}
          _hideGlobalLoading={this.props._hideGlobalLoading}
          revealed={this.state.scenarioEditMetadataModal}
          onCloseClick={this.closeModal.bind(null, 'edit-scenario')}
          scenarioForm={this.props.scenarioForm}
          scenarioData={dataScenario}
          saveScenario={this.props._patchScenario}
          resetForm={this.props._resetScenarioFrom}
        />

        <ScenarioGenSettingsModal
          _showGlobalLoading={this.props._showGlobalLoading}
          _hideGlobalLoading={this.props._hideGlobalLoading}
          revealed={this.state.scenarioGenSettingsModal}
          onCloseClick={this.closeModal.bind(null, 'generate-settings')}
          scenarioForm={this.props.scenarioForm}
          scenarioData={dataScenario}
          saveScenario={this.props._patchScenario}
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
    _resetScenarioFrom: (...args) => dispatch(resetScenarioFrom(...args)),
    _startGenerateResults: (...args) => dispatch(startGenerateResults(...args)),

    _fetchScenarioItemSilent: (...args) => dispatch(fetchScenarioItemSilent(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioPage);

// Processing log component.
const Log = React.createClass({
  propTypes: {
    data: T.object,
    receivedAt: T.number,
    update: T.func
  },

  timeout: null,

  startPolling: function () {
    this.timeout = setTimeout(() => this.props.update(), 2000);
  },

  componentWillUnmount: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  componentDidMount: function () {
    if (this.props.data && this.props.data.status === 'running') {
      // console.log('componentDidMount timeout');
      this.startPolling();
    }
  },

  componentWillReceiveProps: function (nextProps) {
    // Continue polling while the status is 'running';
    if (nextProps.data && nextProps.data.status === 'running' &&
    this.props.receivedAt !== nextProps.receivedAt) {
      // console.log('componentWillReceiveProps timeout');
      this.startPolling();
    }
  },

  render: function () {
    const genAnalysisLog = this.props.data;
    if (!genAnalysisLog) return null;

    if (genAnalysisLog.status === 'complete' && !genAnalysisLog.errored) return null;

    let lastLog = genAnalysisLog.logs[genAnalysisLog.logs.length - 1];

    switch (lastLog.code) {
      case 'routing':
        if (lastLog.data.message.match(/started/)) {
          return (
            <div className='alert alert--info' role='alert'>
              <p><strong><TimeAgo datetime={lastLog.created_at} /></strong> Processing {lastLog.data.count} admin areas</p>
            </div>
          );
        } else {
          return (
            <div className='alert alert--success' role='alert'>
              <p><strong><TimeAgo datetime={lastLog.created_at} /></strong> {lastLog.data.message}</p>
            </div>
          );
        }
      case 'error':
        let e = typeof lastLog.data.error === 'string' ? lastLog.data.error : 'Unknown error';
        return (
          <div className='alert alert--danger' role='alert'>
            <p><strong><TimeAgo datetime={lastLog.created_at} /></strong> {e}</p>
          </div>
        );
      case 'results:bucket':
      case 'results:files':
        return (
          <div className='alert alert--success' role='alert'>
            <p><strong><TimeAgo datetime={lastLog.created_at} /></strong> Finishing up...</p>
          </div>
        );
      default:
        return (
          <div className='alert alert--info' role='alert'>
            <p><strong><TimeAgo datetime={lastLog.created_at} /></strong> {lastLog.data.message}</p>
          </div>
        );
    }
  }
});
