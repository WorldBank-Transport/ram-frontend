'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import Alert from './alert';

const SysAlerts = React.createClass({
  propTypes: {
    items: T.array,
    max: T.number,
    _hide: T.func
  },

  onDismiss: function (id) {
    this.props._hide(id);
  },

  render: function () {
    let items = _.takeRight(this.props.items, this.props.max);
    return (
      <div className='alert-container'>
        {items.map(o => (
          <Alert
            key={o.id}
            type={o.type}
            dismissable={o.dismissable}
            onDismiss={this.onDismiss.bind(null, o.id)}
            autoDismiss={o.autoDismiss || 0}>
            {o.content}
          </Alert>
        ))}
      </div>
    );
  }
});

function selector (state) {
  return {
    items: state.systemAlertsReducer.items,
    max: state.systemAlertsReducer.max
  };
}

function dispatcher (dispatch) {
  return {
    _hide: (...args) => dispatch(hideAlert(...args))
  };
}

export default connect(selector, dispatcher)(SysAlerts);

// Actions.
export const SHOW_ALERT = 'SHOW_ALERT';
export const HIDE_ALERT = 'HIDE_ALERT';

export function showAlert (alertType, content, dismissable, autoDismissTime = null) {
  return {
    type: SHOW_ALERT,
    id: (new Date()).getTime(),
    alertType,
    content,
    dismissable,
    autoDismissTime
  };
}

export function hideAlert (id) {
  return { type: HIDE_ALERT, id };
}

// Reducer.

const initialState = {
  max: 4,
  items: []
  // items: [
  //   {
  //     id: (new Date()).getTime(),
  //     type: 'warning',
  //     content: '1',
  //     dismissable: false,
  //     autoDismiss: null
  //   },
  //   {
  //     id: (new Date()).getTime() + 1,
  //     type: 'warning',
  //     content: '2',
  //     dismissable: false,
  //     autoDismiss: null
  //   },
  //   {
  //     id: (new Date()).getTime() + 2,
  //     type: 'warning',
  //     content: '3',
  //     dismissable: false,
  //     autoDismiss: null
  //   },
  //   {
  //     id: (new Date()).getTime() + 3,
  //     type: 'warning',
  //     content: '4',
  //     dismissable: false,
  //     autoDismiss: 5000
  //   },
  //   {
  //     id: (new Date()).getTime() + 4,
  //     type: 'warning',
  //     content: '5',
  //     dismissable: true,
  //     autoDismiss: 20000
  //   }
  // ]
};

export function systemAlertsReducer (state = initialState, action) {
  switch (action.type) {
    case SHOW_ALERT:
      let newItem = {
        id: action.id,
        type: action.alertType,
        content: action.content,
        dismissable: action.dismissable,
        autoDismiss: action.autoDismissTime
      };
      return Object.assign({}, state, {items: state.items.concat([newItem])});
    case HIDE_ALERT:
      let items = state.items.filter(o => o.id !== action.id);
      return Object.assign({}, state, {items});
  }
  return state;
}
