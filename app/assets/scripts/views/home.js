'use strict';
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';

var Home = React.createClass({
  displayName: 'Home',

  propTypes: {
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
              <h1 className='inpage__title'>Projects</h1>
            </div>
            <div className='inpage__actions'>
              <p>lorem</p>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <ol className>
              <li>Project 1</li>
              <li>Project 2</li>
              <li>Project 3</li>
              <li>Project 4</li>
            </ol>
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
  };
}

function dispatcher (dispatch) {
  return {
  };
}

module.exports = connect(selector, dispatcher)(Home);
