'use strict';
import React, { PropTypes as T } from 'react';
import { Link, hashHistory } from 'react-router';
import { connect } from 'react-redux';
import TimeAgo from 'timeago-react';

import {
  invalidateProjectItem,
  fetchProjectItem,
  removeProjectItemFile,
  invalidateScenarioItem,
  fetchScenarioItem,
  removeScenarioItemFile,
  patchProject,
  deleteProject,
  finishProjectSetup,
  resetProjectFrom,
  resetScenarioFrom,
  // Fetch project without indication of loading.
  fetchProjectItemSilent,
  showAlert
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';
import { fileTypesMatrix } from '../utils/constants';
import { showGlobalLoading, hideGlobalLoading } from '../components/global-loading';

import Breadcrumb from '../components/breadcrumb';
import ProjectFileInput from '../components/project/project-file-input';
import ProjectFileCard from '../components/project/project-file-card';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';
import ScenarioEditModal from '../components/scenario/scenario-edit-modal';
import Alert from '../components/alert';
import LogBase from '../components/log-base';

var ProjectPagePending = React.createClass({
  displayName: 'ProjectPagePending',

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _removeProjectItemFile: T.func,
    _invalidateScenarioItem: T.func,
    _fetchScenarioItem: T.func,
    _removeScenarioItemFile: T.func,
    _patchProject: T.func,
    _deleteProject: T.func,
    _finishProjectSetup: T.func,
    _resetProjectFrom: T.func,
    _resetScenarioFrom: T.func,
    _fetchProjectItemSilent: T.func,
    _showAlert: T.func,

    params: T.object,
    scenario: T.object,
    project: T.object,
    projectForm: T.object,
    scenarioForm: T.object
  },

  // Flag variables to wait for the project and scenario to load.
  elementsLoaded: 0,
  loadingVisible: false,

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

  showLoading: function () {
    this.loadingVisible = true;
    showGlobalLoading();
  },

  hideLoading: function () {
    this.loadingVisible = false;
    hideGlobalLoading();
  },

  getInitialState: function () {
    return {
      projectFormModal: false,
      scenarioFormModal: false
    };
  },

  closeProjectModal: function () {
    this.setState({projectFormModal: false});
  },

  closeScenarioModal: function (data) {
    this.setState({scenarioFormModal: false});
    if (data && data.scenarioSubmitted) {
      this.showLoading();
      // Since we're loading the project, only one element is loaded now, which
      // is the scenario. This will ensure that the loading is properly hidden.
      this.elementsLoaded = 1;
      this.props._fetchProjectItem(this.props.params.projectId);
    }
  },

  onFileUploadComplete: function () {
    this.props._fetchProjectItem(this.props.params.projectId);
    this.props._fetchScenarioItem(this.props.params.projectId, 0);
  },

  onFileDeleteComplete: function (file) {
    switch (file.type) {
      case 'profile':
      case 'admin-bounds':
      case 'villages':
        this.props._removeProjectItemFile(file.id);
        break;
      case 'poi':
      case 'road-network':
        this.props._removeScenarioItemFile(file.id);
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
      case 'finish':
        this.setState({scenarioFormModal: true});
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  isFinishingSetup: function () {
    let finishSetupLog = this.props.project.data.finish_setup;
    if (finishSetupLog) {
      let l = finishSetupLog.logs.length;
      if (l === 0 || finishSetupLog.logs[l - 1].code !== 'error') {
        return true;
      }
    }
    return false;
  },

  componentDidMount: function () {
    this.showLoading();
    this.props._fetchProjectItem(this.props.params.projectId);
    this.props._fetchScenarioItem(this.props.params.projectId, 0);
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
      if (nextProps.project.data.status !== 'pending') {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}`);
      }
    }

    // Url has changed.
    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.showLoading();
      // We're changing project. Invalidate.
      this.props._invalidateProjectItem();
      this.props._fetchProjectItem(nextProps.params.projectId);
      this.props._fetchScenarioItem(nextProps.params.projectId, 0);
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
  },

  renderFileUploadSection: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.scenario;

    // Do not render files if the project is finishing setup.
    if (this.isFinishingSetup()) {
      return null;
    }

    let filesBLock = [
      this.renderFile('profile', this.props.project.data.files),
      this.renderFile('admin-bounds', this.props.project.data.files),
      this.renderFile('villages', this.props.project.data.files)
    ];

    if (!fetched && !receivedAt && fetching) {
      // Show if it's the first loading time.
      filesBLock.push(<p key='loading' className='loading-indicator'>Loading...</p>);
    } else if (fetched && error) {
      filesBLock.push(<div key='error'>Error: {prettyPrint(error)}</div>);
    } else if (fetched) {
      filesBLock.push(this.renderFile('road-network', data.files));
      filesBLock.push(this.renderFile('poi', data.files));
    }

    return (
      <div>
        {filesBLock}
      </div>
    );
  },

  renderFile: function (key, files) {
    // Check if the file exists in the project.
    const file = files.find(f => f.type === key);

    return file
      ? this.renderFileCard(file)
      : this.renderFileInput(key);
  },

  renderFileInput: function (key) {
    let { display, description } = fileTypesMatrix[key];
    let projectId = this.props.project.data.id;
    let scenarioId = this.props.scenario.data.id;
    return (
      <ProjectFileInput
        key={key}
        name={display}
        description={description}
        type={key}
        projectId={projectId}
        scenarioId={scenarioId}
        onFileUploadComplete={this.onFileUploadComplete} />
    );
  },

  renderFileCard: function (file) {
    let { display, description } = fileTypesMatrix[file.type];
    let projectId = this.props.project.data.id;
    let scenarioId = this.props.scenario.data.id;
    return (
      <ProjectFileCard
        key={file.type}
        fileId={file.id}
        name={display}
        description={description}
        type={file.type}
        projectId={projectId}
        scenarioId={scenarioId}
        onFileDeleteComplete={this.onFileDeleteComplete.bind(null, file)} />
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
              {this.renderBreadcrumb()}
              <h1 className='inpage__title'>{data.name}</h1>
            </div>
            <ProjectHeaderActions
              project={data}
              projectStatus='pending'
              onAction={this.onProjectAction} />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            {this.props.projectForm.action === 'delete' && this.props.projectForm.processing
              ? <p>Project is being deleted. Please wait</p>
              : null
            }
            {this.props.projectForm.action === 'delete' && this.props.projectForm.error
              ? prettyPrint(this.props.projectForm.error)
              : null
            }

            <Log
              data={data.finish_setup}
              receivedAt={this.props.project.receivedAt}
              projectId={this.props.params.projectId}
              update={this.props._fetchProjectItemSilent.bind(null, this.props.params.projectId)}
            />

            {this.renderFileUploadSection()}
          </div>
        </div>

        <ProjectFormModal
          editing
          _showGlobalLoading={this.showLoading}
          _hideGlobalLoading={this.hideLoading}
          _showAlert={this.props._showAlert}
          revealed={this.state.projectFormModal}
          onCloseClick={this.closeProjectModal}
          projectForm={this.props.projectForm}
          projectData={data}
          saveProject={this.props._patchProject}
          resetForm={this.props._resetProjectFrom}
        />

        <ScenarioEditModal
          finishingSetup
          _showGlobalLoading={this.showLoading}
          _hideGlobalLoading={this.hideLoading}
          _showAlert={this.props._showAlert}
          revealed={this.state.scenarioFormModal}
          onCloseClick={this.closeScenarioModal}
          scenarioData={this.props.scenario.data}
          scenarioForm={this.props.scenarioForm}
          saveScenario={this.props._finishProjectSetup}
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
    scenario: state.scenarioItem,
    projectForm: state.projectForm,
    scenarioForm: state.scenarioForm
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _removeProjectItemFile: (...args) => dispatch(removeProjectItemFile(...args)),
    _invalidateScenarioItem: (...args) => dispatch(invalidateScenarioItem(...args)),
    _fetchScenarioItem: (...args) => dispatch(fetchScenarioItem(...args)),
    _removeScenarioItemFile: (...args) => dispatch(removeScenarioItemFile(...args)),
    _patchProject: (...args) => dispatch(patchProject(...args)),
    _deleteProject: (...args) => dispatch(deleteProject(...args)),
    _finishProjectSetup: (...args) => dispatch(finishProjectSetup(...args)),
    _resetProjectFrom: (...args) => dispatch(resetProjectFrom(...args)),
    _resetScenarioFrom: (...args) => dispatch(resetScenarioFrom(...args)),

    _fetchProjectItemSilent: (...args) => dispatch(fetchProjectItemSilent(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPagePending);

class Log extends LogBase {
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
            <p>{log.data.message} <Link to={`/${getLanguage()}/projects/${this.props.projectId}`}>Go to Project</Link></p>
          </Alert>
        );
      default:
        return (
          <Alert type='info'>
            <h6>Finishing setup <TimeAgo datetime={log.created_at} /></h6>
            <p>{log.data.message}</p>
          </Alert>
        );
    }
  }
}
