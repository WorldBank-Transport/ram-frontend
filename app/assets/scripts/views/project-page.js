'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import { hashHistory } from 'react-router';

import { invalidateProjectItem, fetchProjectItem } from '../actions';
import { prettyPrint } from '../utils/utils';

var ProejctPage = React.createClass({
  displayName: 'ProejctPage',

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
    if (this.props.params.projectId !== nextProps.params.projectId) {
      this.props._fetchProjectItem(nextProps.params.projectId);
    }

    var error = nextProps.project.error;
    if (error && (error.statusCode === 404 || error.statusCode === 400)) {
      hashHistory.push(`/404`);
    }
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
              <ol className='inpage__breadcrumb'>
                <li><a href='' title='View page'>Lorem</a></li>
                <li><a href='' title='View page'>Ipsum</a></li>
              </ol>
              <h1 className='inpage__title'>{data.name}</h1>
            </div>
            <div className='inpage__actions'>
              <p>lorem</p>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <pre>
              {JSON.stringify(data, null, '  ')}
            </pre>
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
    _fetchProjectItem: (...args) => dispatch(fetchProjectItem(...args))
  };
}

module.exports = connect(selector, dispatcher)(ProejctPage);
