'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
import { connect } from 'react-redux';

import {
  invalidateProjectItem,
  fetchProjectItem,
  removeProjectItemFile,
  invalidateScenarioItem,
  fetchScenarioItem,
  removeScenarioItemFile,
  patchProject,
  deleteProject
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';

import Breadcrumb from '../components/breadcrumb';
import ProjectFileInput from '../components/project/project-file-input';
import ProjectFileCard from '../components/project/project-file-card';
import ProjectFormModal from '../components/project/project-form-modal';
import ProjectHeaderActions from '../components/project/project-header-actions';

const fileTypesMatrix = {
  profile: {
    display: t('Profile'),
    description: t('The profile is used to convert osm to osrm')
  },
  'admin-bounds': {
    display: t('Administrative Boundaries'),
    description: t('GeoJSON file containing the administrative boundaries')
  },
  villages: {
    display: t('Village and population data'),
    description: t('Villages GeoJSON with population data')
  },
  poi: {
    display: t('Points of interest'),
    description: t('GeoJSON for the points of interest (banks, hospitals...)')
  },
  'road-network': {
    display: t('Road Network'),
    description: t('Road network to use')
  }
};

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

    params: T.object,
    scenario: T.object,
    project: T.object,
    projectForm: T.object
  },

  forceLoading: false,

  getInitialState: function () {
    return {
      projectFormModal: false
    };
  },

  closeModal: function () {
    this.setState({projectFormModal: false});
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
        this.props._deleteProject(this.props.params.projectId);
        break;
      default:
        throw new Error(`Project action not implemented: ${what}`);
    }
  },

  componentDidMount: function () {
    this.props._fetchProjectItem(this.props.params.projectId);
    this.props._fetchScenarioItem(this.props.params.projectId, 0);
  },

  componentWillUnmount: function () {
    this.props._invalidateProjectItem();
  },

  componentWillReceiveProps: function (nextProps) {
    if (!this.props.project.fetched && nextProps.project.fetched) {
      // Project just fetched. Validate status;
      if (nextProps.project.data.status !== 'pending') {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}`);
      }
    }

    if (this.props.params.projectId !== nextProps.params.projectId) {
      // We're changing project. Invalidate.
      this.props._invalidateProjectItem();
      this.props._fetchProjectItem(nextProps.params.projectId);
      this.props._fetchScenarioItem(nextProps.params.projectId, 0);
    }

    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    if (this.props.projectForm.action === 'delete' &&
        this.props.projectForm.processing &&
        !nextProps.projectForm.processing &&
        !nextProps.projectForm.error) {
      return hashHistory.push(`/${getLanguage()}/projects`);
    }
  },

  renderFileUploadSection: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.scenario;

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
    return (
      <ProjectFileInput
        key={key}
        name={display}
        description={description}
        type={key}
        projectId={projectId}
        scenarioId={0}
        onFileUploadComplete={this.onFileUploadComplete} />
    );
  },

  renderFileCard: function (file) {
    let { display, description } = fileTypesMatrix[file.type];
    let projectId = this.props.project.data.id;
    return (
      <ProjectFileCard
        key={file.type}
        fileId={file.id}
        name={display}
        description={description}
        type={file.type}
        projectId={projectId}
        scenarioId={0}
        onFileDeleteComplete={this.onFileDeleteComplete.bind(null, file)} />
    );
  },

  render: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.project;

    if (!fetched && !fetching) {
      return null;
    }

    // Show if it's the first loading time.
    if (!receivedAt && fetching) {
      return <p className='loading-indicator'>Loading...</p>;
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

            {this.props.projectForm.action === 'delete' && this.props.projectForm.processing
              ? <p>Project is being deleted. Please wait</p>
              : null
            }
            {this.props.projectForm.action === 'delete' && this.props.projectForm.error
              ? prettyPrint(this.props.projectForm.error)
              : null
            }

            {prettyPrint(data)}

            {this.renderFileUploadSection()}
          </div>
        </div>

        <ProjectFormModal
          editing
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
    _removeProjectItemFile: (...args) => dispatch(removeProjectItemFile(...args)),
    _invalidateScenarioItem: (...args) => dispatch(invalidateScenarioItem(...args)),
    _fetchScenarioItem: (...args) => dispatch(fetchScenarioItem(...args)),
    _removeScenarioItemFile: (...args) => dispatch(removeScenarioItemFile(...args)),
    _patchProject: (...args) => dispatch(patchProject(...args)),
    _deleteProject: (...args) => dispatch(deleteProject(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPagePending);
