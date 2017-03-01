'use strict';
import React, { PropTypes as T } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { hashHistory } from 'react-router';

import Breadcrumb from '../components/breadcrumb';

import { invalidateProjectItem, fetchProjectItem, removeProjectItemFile } from '../actions';
import { prettyPrint } from '../utils/utils';

import ProjectFileInput from '../components/project-file-input';
import ProjectFileCard from '../components/project-file-card';

const fileTypesMatrix = {
  profile: {
    display: 'Profile',
    description: 'The profile is used to convert osm to osrm'
  },
  'admin-bounds': {
    display: 'Administrative Boundaries',
    description: 'GeoJSON file containing the administrative boundaries'
  },
  villages: {
    display: 'Village and population data',
    description: 'Villages GeoJSON with population data'
  }
};

var ProjectPage = React.createClass({
  displayName: 'ProjectPage',

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,
    _removeProjectItemFile: T.func,

    params: T.object,
    project: T.object
  },

  componentDidMount: function () {
    this.props._fetchProjectItem(this.props.params.projectId);
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.props._fetchProjectItem(nextProps.params.projectId);
    }

    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      hashHistory.push(`/404`);
    }
  },

  onFileUploadComplete: function () {
    this.props._fetchProjectItem(this.props.params.projectId);
  },

  onFileDeleteComplete: function (fileId) {
    this.props._removeProjectItemFile(fileId);
  },

  renderFile: function (key) {
    // Check if the file exists in the project.
    const file = this.props.project.data.files.find(f => f.type === key);

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
        onFileDeleteComplete={this.onFileDeleteComplete.bind(null, file.id)} />
    );
  },

  render: function () {
    let { fetched, fetching, error, data } = this.props.project;

    if (!fetched && !fetching) {
      return null;
    }

    if (fetching) {
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
              <a className='button button--achromic'><span>Action</span></a>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <pre>
              {JSON.stringify(data, null, '  ')}
            </pre>

            {this.renderFile('profile')}
            {this.renderFile('admin-bounds')}
            {this.renderFile('villages')}
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
    project: state.projectItem
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjectItem: (...args) => dispatch(invalidateProjectItem(...args)),
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args)),
    _removeProjectItemFile: (...args) => dispatch(removeProjectItemFile(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPage);
