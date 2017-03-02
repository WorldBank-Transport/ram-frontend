'use strict';
import React, { PropTypes as T } from 'react';
import { hashHistory } from 'react-router';
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
                triggerClassName='button button--achromic'
                triggerText='Action'
                triggerTitle='Action'
                direction='down'
                alignment='right' >
                  <ul className='drop__menu drop__menu--select' role='menu'>
                    <li><a href='#' title='action' className='drop__menu-item drop__menu-item--active'>Action A</a></li>
                    <li><a href='#' title='action' className='drop__menu-item'>Action B</a></li>
                  </ul>
              </Dropdown>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            {prettyPrint(data)}

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
