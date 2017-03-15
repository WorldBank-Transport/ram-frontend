'use strict';
import React, { PropTypes as T } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const LoadingGlobal = React.createClass({

  propTypes: {
    revealed: T.bool
  },

  componentAddedBodyClass: false,

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
    this.toggleBodyClass(this.props.revealed);
  },

  componentDidUpdate: function () {
    this.toggleBodyClass(this.props.revealed);
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

        {this.props.revealed ? this.renderLoading() : null}

      </ReactCSSTransitionGroup>
    );
  }
});

export default LoadingGlobal;
