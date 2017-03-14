'use strict';
import React, { PropTypes as T } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import Breadcrumb from '../components/breadcrumb';
import ScenarioHeaderActions from '../components/scenario/scenario-header-actions';


var ScenarioPage = React.createClass({
  propTypes: {
    params: T.object
  },

  render: function () {
    return (
      <section className='inpage inpage--hub'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <Breadcrumb />
              <h1 className='inpage__title'>Scenario name</h1>
            </div>
            <ScenarioHeaderActions />
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <p>Scenario Content goes here.</p>

            <div className='alert alert--success' role='alert'>
              <button className='alert__button-dismiss' title='Dismiss alert'><span>Dismiss</span></button>
              <p><strong>Success:</strong> This is a success alert message.</p>
            </div>

            <table className='table'>
              <thead>
                <tr>
                  <th>Title 1</th>
                  <th>Title 2</th>
                  <th>Title 3</th>
                  <th>Title 4</th>
                </tr>
              </thead>
              <tfoot>
                <tr>
                  <td>Foot Content</td>
                  <td>Foot Content</td>
                  <td>Foot Content</td>
                  <td>Foot Content</td>
                </tr>
              </tfoot>
              <tbody>
                <tr>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                </tr>
                <tr>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                </tr>
                <tr>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                  <td>Content</td>
                </tr>
              </tbody>
            </table>

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

module.exports = connect(selector, dispatcher)(ScenarioPage);
