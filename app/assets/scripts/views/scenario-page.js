'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';

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

  fetchScenarioItemSilent
} from '../actions';
import { prettyPrint, fetchStatus } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import config from '../config';

import Breadcrumb from '../components/breadcrumb';
import ScenarioHeaderActions from '../components/scenario/scenario-header-actions';
import ScenarioEditModal from '../components/scenario/scenario-edit-modal';

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

    scenario: T.object,
    project: T.object,
    scenarioForm: T.object
  },

  getInitialState: function () {
    return {
      scenarioEditMetadataModal: false
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

  closeModal: function (what) {
    switch (what) {
      case 'edit-scenario':
        this.setState({scenarioEditMetadataModal: false});
        break;
    }
  },

  checkAllLoaded: function (nextProps) {
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.projectLoaded = true;
    }
    if (this.props.scenario.fetching && !nextProps.scenario.fetching) {
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
    this.props._fetchScenarioItem(this.props.params.projectId, this.props.params.scenarioId);
  },

  componentWillUnmount: function () {
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
  },

  onScenarioAction: function (what, event) {
    event.preventDefault();

    switch (what) {
      case 'edit-metadata':
        this.setState({scenarioEditMetadataModal: true});
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
      return (
        <ul>
          {data.files.filter(f => f.type === 'results').map(o => {
            return (
              <li key={o.id}>
                <a href={`${config.api}/projects/${data.project_id}/scenarios/${data.id}/files/${o.id}?download=true`}>{o.name}</a>
              </li>
            );
          })}
        </ul>
      );
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

    _fetchScenarioItemSilent: (...args) => dispatch(fetchScenarioItemSilent(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioPage);

var Log = React.createClass({

  propTypes: {
    data: T.object,
    receivedAt: T.number,
    update: T.func
  },

  componentDidMount: function () {
    if (this.props.data == null || this.props.data.status === 'running') {
      console.log('setting timeout');
      setTimeout(() => {
        this.props.update();
      }, 1000);
    }
  },

  componentWillReceiveProps: function (nextProps) {
    console.log('nextProps', nextProps);
    if (nextProps.data == null || (nextProps.data && nextProps.data.status === 'running' &&
    this.props.receivedAt !== nextProps.receivedAt)) {
      console.log('setting timeout up');
      setTimeout(() => {
        this.props.update();
      }, 1000);
    }
  },

  render: function () {
    const genAnalysisLog = this.props.data;
    if (!genAnalysisLog) return <p>Process starting</p>;

    if (genAnalysisLog.status === 'complete' && !genAnalysisLog.errored) return null;

    return (
      <ul>
      {genAnalysisLog.logs.map(l => {
        switch (l.code) {
          case 'routing':
            if (l.data.message.match(/started/)) {
              return <li key={l.id}>[{l.created_at}] Processing {l.data.count} admin areas</li>;
            } else {
              return <li key={l.id}>[{l.created_at}] Processing areas complete</li>;
            }
          case 'routing:area':
            return <li key={l.id}>[{l.created_at}] Processing areas {l.data.adminArea}</li>;
          case 'error':
            let e = typeof l.data.error === 'string' ? l.data.error : 'unknown';
            return <li key={l.id}>[{l.created_at}] <strong>ERROR:</strong> {e}</li>;
          default:
            return <li key={l.id}>[{l.created_at}] {l.data.message}</li>;
        }
      })}
      </ul>
    );
  }
});
