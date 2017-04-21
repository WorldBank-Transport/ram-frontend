'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';
import TimeAgo from 'timeago-react';

import {
  invalidateProjectItem,
  deleteScenario,
  patchScenario,
  resetScenarioFrom,
  fetchProjectItem,
  invalidateScenarioItem,
  fetchScenarioItem,
  startGenerateResults,
  // Fetch scenario without indication of loading.
  fetchScenarioItemSilent,
  fetchScenarioResults
} from '../actions';
import { prettyPrint, fetchStatus } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import config from '../config';
import { showGlobalLoading, hideGlobalLoading } from '../components/global-loading';

import Breadcrumb from '../components/breadcrumb';
import ScenarioHeaderActions from '../components/scenario/scenario-header-actions';
import ScenarioEditModal from '../components/scenario/scenario-edit-modal';
import ScenarioGenSettingsModal from '../components/scenario/scenario-generation-settings-modal';
import ScenarioIDModal from '../components/scenario/scenario-id-modal';
import Alert from '../components/alert';
import LogBase from '../components/log-base';
import ScenarioResults from '../components/scenario-results';

var ScenarioPage = React.createClass({
  propTypes: {
    params: T.object,
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _invalidateScenarioItem: T.func,
    _fetchScenarioItem: T.func,
    _deleteScenario: T.func,
    _patchScenario: T.func,
    _resetScenarioFrom: T.func,
    _startGenerateResults: T.func,
    _fetchScenarioItemSilent: T.func,
    _fetchScenarioResults: T.func,

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
      case 'generate':
        this.setState({scenarioGenSettingsModal: true});
        break;
      case 'edit-network':
        this.setState({scenarioIDModal: true});
        break;
      case 'delete':
        this.showLoading();
        this.props._deleteScenario(this.props.params.projectId, this.props.params.scenarioId);
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

    let resultsFile = dataScenario.files.find(f => f.type === 'results-all');

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

            {this.renderFiles()}

            {resultsFile ? (
              <ScenarioResults
                projectId={dataScenario.project_id}
                scenarioId={dataScenario.id}
                resultFileId={resultsFile.id}
              />
            ) : null}

          </div>
        </div>

        <ScenarioEditModal
          _showGlobalLoading={showGlobalLoading}
          _hideGlobalLoading={hideGlobalLoading}
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

    _fetchScenarioItemSilent: (...args) => dispatch(fetchScenarioItemSilent(...args)),
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args))
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
      case 'routing:area':
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
