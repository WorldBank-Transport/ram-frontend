'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';

import { invalidateProjects, fetchProjects } from '../actions';
import { prettyPrint } from '../utils/utils';
import { t } from '../utils/i18n';

var Home = React.createClass({
  displayName: 'Home',

  propTypes: {
    _invalidateProjects: T.func,
    _fetchProjects: T.func,

    projects: T.object
  },

  componentDidMount: function () {
    this.props._fetchProjects();
  },

  renderProjectListItem: function (project) {
    delete project.files; // remove
    return (
      <li key={project.id}>
        <pre>
          {JSON.stringify(project, null, '  ')}
        </pre>
      </li>
    );
  },

  renderProjectList: function () {
    let { fetched, fetching, error, data } = this.props.projects;

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
      <ol className>
        {data.results.map(o => this.renderProjectListItem(o))}
        <li><a className='button button--achromic button--large'><span>Button</span></a></li>
      </ol>
    );
  },

  render: function () {
    return (
      <section className='inpage inpage--hub'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <ol className='inpage__breadcrumb'>
                <li><a href='' title='View page'>Lorem</a></li>
                <li><a href='' title='View page'>Ipsum</a></li>
              </ol>
              <h1 className='inpage__title'>{t('Projects')}</h1>
            </div>
            <div className='inpage__actions'>
              <a className='b-new'><span>New project</span></a>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            {this.renderProjectList()}
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
    projects: state.projects
  };
}

function dispatcher (dispatch) {
  return {
    _invalidateProjects: (...args) => dispatch(invalidateProjects(...args)),
    _fetchProjects: (...args) => dispatch(fetchProjects(...args))
  };
}

module.exports = connect(selector, dispatcher)(Home);
