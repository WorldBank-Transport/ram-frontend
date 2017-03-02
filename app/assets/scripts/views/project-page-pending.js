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
  removeScenarioItemFile
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';

import Breadcrumb from '../components/breadcrumb';
import Dropdown from '../components/dropdown';
import ProjectFileInput from '../components/project/project-file-input';
import ProjectFileCard from '../components/project/project-file-card';

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

    params: T.object,
    scenario: T.object,
    project: T.object
  },

  forceLoading: false,

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

  renderFileUploadSection: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.scenario;

    let scenarioData;
    if (!fetched && !fetching) {
      scenarioData = null;
    // Show if it's the first loading time.
    } else if (!receivedAt && fetching) {
      scenarioData = <p className='loading-indicator'>Loading...</p>;
    } else if (error) {
      scenarioData = <div>Error: {prettyPrint(error)}</div>;
    } else {
      scenarioData = (
        <div>
          {this.renderFile('road-network', data.files)}
          {this.renderFile('poi', data.files)}
        </div>
      );
    }

    return (
      <div>
        {this.renderFile('profile', this.props.project.data.files)}
        {this.renderFile('admin-bounds', this.props.project.data.files)}
        {this.renderFile('villages', this.props.project.data.files)}
        {scenarioData}
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
            <div className='inpage__actions'>
              <Dropdown
                triggerClassName='ipa-ellipsis'
                triggerActiveClassName='button--active'
                triggerText='Action'
                triggerTitle='Action'
                direction='down'
                alignment='center' >
                  <ul className='drop__menu drop__menu--iconified' role='menu'>
                    <li><a href='#' title='action' className='drop__menu-item dmi-pencil'>Edit meta data</a></li>
                  </ul>
                  <ul className='drop__menu drop__menu--iconified' role='menu'>
                    <li><a href='#' title='action' className='drop__menu-item dmi-trash'>Delete project</a></li>
                  </ul>
              </Dropdown>
              <button title='Finish setup' className='ipa-tick' type='button'><span>Finish setup</span></button>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            {prettyPrint(data)}

            {this.renderFileUploadSection()}
          </div>
        </div>

      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    project: state.projectItem,
    scenario: state.scenarioItem
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _removeProjectItemFile: (...args) => dispatch(removeProjectItemFile(...args)),
    _invalidateScenarioItem: (...args) => dispatch(invalidateScenarioItem(...args)),
    _fetchScenarioItem: (...args) => dispatch(fetchScenarioItem(...args)),
    _removeScenarioItemFile: (...args) => dispatch(removeScenarioItemFile(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPagePending);
