'use strict';
import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

// Minimum time the loading is visible.
const MIN_TIME = 512;
// Since we have a minimum display time we use a timeout to hide it if
// when the hide method is called the time isn't over yet. However, if in
// the mean time the loading is shown again we need to clear the timeout.
var hideTimeout = null;

// Once the component is mounted we store it to be able to access it from
// the outside.
var theGlobalLoading = null;

const GlobalLoading = React.createClass({
  componentAddedBodyClass: false,

  getInitialState: function () {
    return {
      showTimestamp: 0,
      revealed: false
    };
  },

  toggleBodyClass: function (revealed) {
    let bd = document.getElementsByTagName('body')[0];
    if (revealed) {
      this.componentAddedBodyClass = true;
      bd.classList.add('unscrollable-y');
    } else if (this.componentAddedBodyClass) {
      // Only act if the class was added by this component.
      this.componentAddedBodyClass = false;
      bd.classList.remove('unscrollable-y');
    }
  },

  componentDidMount: function () {
    if (theGlobalLoading !== null) {
      throw new Error('<GlobalLoading /> component was already mounted. Only 1 is allowed.');
    }
    theGlobalLoading = this;
    this.toggleBodyClass(this.state.revealed);
  },

  componentDidUpdate: function () {
    this.toggleBodyClass(this.state.revealed);
  },

  componentWillUnmount: function () {
    this.toggleBodyClass(false);
  },

  renderLoading: function () {
    return (
      <div className='loading-pane'>
        <div className='spinner'>
          <div className='spinner__bounce'></div>
          <div className='spinner__bounce'></div>
          <div className='spinner__bounce'></div>
        </div>
      </div>
    );
  },

  render: function () {
    return (
      <ReactCSSTransitionGroup
        component='div'
        transitionName='loading-pane'
        transitionEnterTimeout={300}
        transitionLeaveTimeout={300} >

        {this.state.revealed ? this.renderLoading() : null}

      </ReactCSSTransitionGroup>
    );
  }
});

export default GlobalLoading;

export function showGlobalLoading () {
  if (theGlobalLoading === null) {
    throw new Error('<GlobalLoading /> component not mounted');
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }

  theGlobalLoading.setState(Object.assign({}, {
    showTimestamp: Date.now(),
    revealed: true
  }));
}

export function hideGlobalLoading (force = false) {
  if (theGlobalLoading === null) {
    throw new Error('<GlobalLoading /> component not mounted');
  }

  if (force) {
    return theGlobalLoading.setState(Object.assign({}, {
      revealed: false
    }));
  }

  let time = theGlobalLoading.state.showTimestamp;
  let diff = Date.now() - time;
  if (diff >= MIN_TIME) {
    theGlobalLoading.setState(Object.assign({}, {
      revealed: false
    }));
  } else {
    hideTimeout = setTimeout(() => {
      theGlobalLoading.setState(Object.assign({}, {
        revealed: false
      }));
    }, MIN_TIME - diff);
  }
}
