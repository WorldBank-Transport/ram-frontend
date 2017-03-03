'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory, Link } from 'react-router';
import { connect } from 'react-redux';

import {
  invalidateProjectItem,
  fetchProjectItem
} from '../actions';
import { prettyPrint } from '../utils/utils';
import { getLanguage } from '../utils/i18n';

import Breadcrumb from '../components/breadcrumb';
import Dropdown from '../components/dropdown';

var ProjectPageActive = React.createClass({
  displayName: 'ProjectPageActive',

  propTypes: {
    _invalidateProjectItem: T.func,
    _fetchProjectItem: T.func,

    params: T.object,
    project: T.object
  },

  componentDidMount: function () {
    this.props._fetchProjectItem(this.props.params.projectId);
  },

  componentWillUnmount: function () {
    this.props._invalidateProjectItem();
  },

  componentWillReceiveProps: function (nextProps) {
    if (!this.props.project.fetched && nextProps.project.fetched) {
      // Project just fetched. Validate status;
      if (nextProps.project.data.status === 'pending') {
        return hashHistory.push(`/${getLanguage()}/projects/${this.props.params.projectId}/setup`);
      }
    }

    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.props._fetchProjectItem(nextProps.params.projectId);
    }

    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      hashHistory.push(`/${getLanguage()}/404`);
    }
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
                    <li><a href='#' title='action' className='drop__menu-item drop__menu-item--danger dmi-trash'>Delete project</a></li>
                  </ul>
              </Dropdown>
              <button title='Create new scenario' className='ipa-plus' type='button'><span>New scenario</span></button>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <section className='diptych diptych--details'>
              <h2>Details</h2>
              <dl>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
                <dt>Description</dt>
                <dd>Lorem ipsum dolor sit amet description.</dd>
              </dl>


              {prettyPrint(data)}
            </section>

            <section className='diptych diptych--scenarios'>
              <h2>Scenarios</h2>
              <p>Lorem ipsum dolor sit amet.</p>

              <ol className='card-list scenarios-card-list'>
                <li>
                  <article className='scenario scenario--card card' id={`scenario-1234`}>
                    <div className='card__contents' title='View scenario'>
                      <header className='card__header'>
                        <div className='card__headline'>
                          <Link to='' title='View scenario' className='link-wrapper'>
                            <h1 className='card__title'>Scenario title</h1>
                          </Link>
                          <p className='card__subtitle'>Scenario subtitle</p>
                        </div>
                      </header>
                      <div className='card__body'>
                        <div className='card__summary'>
                          <p>Lorem ipsum dolor sit amet description.</p>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
                <li>
                  <button className='card__button card__button--add'><span>New scenario</span></button>
                </li>
              </ol>
            </section>

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
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProjectPageActive);
