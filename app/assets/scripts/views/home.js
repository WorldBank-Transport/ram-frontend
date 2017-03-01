'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { invalidateProjects, fetchProjects } from '../actions';
import { prettyPrint } from '../utils/utils';
import { t, getLanguage } from '../utils/i18n';

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
      <li className='' key={project.id}>
        <article className='project project--card card' id={`project-${project.id}`}>
          <Link to={`/${getLanguage()}/projects/${project.id}`} className='card__contents' title='View project'>
            <figure className='card__media'>
              <div className='card__thumbnail'>
                <img alt='Project thumbnail' width='640' height='320' src='/assets/graphics/layout/projects-thumbnail-placeholder.png' />
              </div>
            </figure>
            <div className='card__copy'>
              <header className='card__header'>
                <h1 className='card__title'>{project.name}</h1>
                <p className='card__subtitle'>Scenarios info</p>
              </header>
              <div className='card__body'>
                <div className='prose'>
                  <p>{project.description}</p>
                </div>
              </div>
              <footer className='card__footer'>
                <dl className='card__system-details'>
                  <dt>Updated</dt>
                  <dd className='updated'>{project.updated_at}</dd>
                  <dt>Status</dt>
                  <dd className='status'>{project.status}</dd>
                </dl>
              </footer>
            </div>
          </Link>
        </article>
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
      <ol className='card-list projects-card-list'>
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
