'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import c from 'classnames';

import Header from '../components/header';
import Footer from '../components/footer';
import LoadingGlobal from '../components/loading-global';
import ConfirmationPrompt from '../components/confirmation-prompt';

var App = React.createClass({
  displayName: 'App',

  propTypes: {
    globalLoading: T.bool,

    routes: T.array,
    children: T.object
  },

  render: function () {
    const pageClass = _.get(_.last(this.props.routes), 'pageClass', '');

    return (
      <div className={c('page', pageClass)}>
        <Header />
        <main className='page__body' role='main'>
          {this.props.children}
        </main>
        <Footer />
        <LoadingGlobal revealed={this.props.globalLoading} />
        <ConfirmationPrompt />
      </div>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    globalLoading: state.app.globalLoading
  };
}

function dispatcher (dispatch) {
  return {
  };
}

module.exports = connect(selector, dispatcher)(App);
