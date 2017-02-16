'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';

var Home = React.createClass({
  displayName: 'Home',

  propTypes: {
  },

  render: function () {
    return (
      <section className='section section--home'>
        In the beginning the world was created. This upset a lot of people and was widely regarded as a bad idea.
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
  };
}

function dispatcher (dispatch) {
  return {
  };
}

module.exports = connect(selector, dispatcher)(Home);
