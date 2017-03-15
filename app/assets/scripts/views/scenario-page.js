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
  fetchScenarioItem
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';

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
    if (this.props.project.fetching && !nextProps.project.fetching) {
      this.projectLoaded = true;
    }
    if (this.props.scenario.fetching && !nextProps.scenario.fetching) {
      this.scenarioLoaded = true;
    }

    if (this.projectLoaded && this.scenarioLoaded && this.loadingVisible) {
      this.hideLoading();
    }

    var error = nextProps.scenario.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      this.hideLoading();
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    // if (!this.props.project.fetched && nextProps.project.fetched) {
    //   // Project just fetched. Validate status;
    //   if (nextProps.project.data.status === 'pending') {
    //     return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}/setup`);
    //   }
    // }

    if (this.props.params.projectId !== nextProps.params.projectId ||
      this.props.params.scenarioId !== nextProps.params.scenarioId) {
      this.showLoading();
      this.props._fetchScenarioItem(nextProps.params.projectId, nextProps.params.scenarioId);
    }

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

  render: function () {
    let { fetched: fetchedProject, fetching: fetchingProject, error: errorProject } = this.props.project;
    let { fetched: fetchedScenario, fetching: fetchingScenario, error: errorScenario, data: dataScenario } = this.props.scenario;
    let formError = this.props.scenarioForm.error;

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
            <pre>{prettyPrint(dataScenario)}</pre>
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
    _resetScenarioFrom: (...args) => dispatch(resetScenarioFrom(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioPage);
