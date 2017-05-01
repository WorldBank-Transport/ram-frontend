'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';

import {
  fetchScenarioResults
} from '../../actions';
import { prettyPrint, percent } from '../../utils/utils';

const ScenarioResults = React.createClass({

  propTypes: {
    projectId: T.number,
    scenarioId: T.number,
    resultFileId: T.number,
    results: T.object,
    _fetchScenarioResults: T.func
  },

  componentDidMount: function () {
    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, this.props.resultFileId);
  },

  renderAccessibilityTableRow: function (poi, aa) {
    if (!aa.results.length) {
      return (
        <tr key={aa.name}>
          <td>{aa.name}</td>
          <td colSpan={4}>There's no data.</td>
        </tr>
      );
    }

    // Helper to sum the population of the admin area villages.
    const sumPop = (arr) => arr.reduce((acc, o) => acc + (parseInt(o.population) || 1), 0);
    let totalPop = sumPop(aa.results);
    let times = [10, 20, 30, 60];
    let pop = times.map(time => sumPop(aa.results.filter(o => o.poi[poi] <= time * 60)));

    return (
      <tr key={aa.name}>
        <td>{aa.name}</td>
        <td>{percent(pop[0], totalPop)}%</td>
        <td>{percent(pop[1], totalPop)}%</td>
        <td>{percent(pop[2], totalPop)}%</td>
        <td>{percent(pop[3], totalPop)}%</td>
      </tr>
    );
  },

  renderAccessibilityTable: function (poi) {
    let data = this.props.results.data;

    return (
      <div>
        <h2>Point of interest</h2>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>10 min</th>
              <th>20 min</th>
              <th>30 min</th>
              <th>60 min</th>
            </tr>
          </thead>
          <tbody>
          {data.map(aa => this.renderAccessibilityTableRow(poi, aa))}
          </tbody>
        </table>
      </div>
    );
  },

  render: function () {
    let { fetched, fetching, error } = this.props.results;

    if (!fetched && !fetching) {
      return null;
    }

    if (fetching) {
      return <p>Loading results...</p>;
    }

    if (error) {
      return <div>Error: {prettyPrint(error)}</div>;
    }

    return (
      <div>
        {this.renderAccessibilityTable('pointOfInterest')}
      </div>
    );
  }
});

function selector (state) {
  return {
    results: state.scenarioResults
  };
}

function dispatcher (dispatch) {
  return {
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioResults);
