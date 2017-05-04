'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import c from 'classnames';

import {
  fetchScenarioResults
} from '../../actions';
import { prettyPrint, percent, toTimeStr } from '../../utils/utils';
import { t } from '../../utils/i18n';

const ScenarioResults = React.createClass({

  propTypes: {
    projectId: T.number,
    scenarioId: T.number,
    resultFileId: T.number,
    results: T.object,
    _fetchScenarioResults: T.func
  },

  getInitialState: function () {
    return {
      rawSort: {
        field: 'name',
        asc: true
      }
    };
  },

  componentDidMount: function () {
    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, this.props.resultFileId);
  },

  setRawSort: function (field, e) {
    e && e.preventDefault();

    let sort;
    if (field === this.state.rawSort.field) {
      sort = { field, asc: !this.state.rawSort.asc };
    } else {
      sort = { field, asc: true };
    }

    this.setState({ rawSort: sort });
  },

  renderAccessibilityTableRow: function (poi, aa) {
    if (!aa.results.length) {
      return (
        <tr key={aa.name}>
          <th>{aa.name}</th>
          <td className='table__empty-cell' colSpan={4}>{t('No data.')}</td>
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
        <th>{aa.name}</th>
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
        <h2 className='inpage__section-title'>Points of interest</h2>

        <section className='card card--analysis-result'>
          <div className='card__contents'>
            <header className='card__header'>
              <h1 className='card__title'>Assorted</h1>
            </header>
            <div className='card__body'>
              <div className='table-wrapper'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>Admin area</th>
                      <th>10 min</th>
                      <th>20 min</th>
                      <th>30 min</th>
                      <th>60 min</th>
                    </tr>
                  </thead>
                  <tbody>
                  {_.sortBy(data, o => _.deburr(o.name)).map(aa => this.renderAccessibilityTableRow(poi, aa))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  },

  renderRawResultsTable: function () {
    let data = this.props.results.data;
    let { field: sortField, asc } = this.state.rawSort;

    let villages = data.reduce((acc, o) => {
      if (!o.results.length) return acc;

      // Add admin area name to each village.
      let results = o.results.map(r => {
        r.aa = o.name;
        return r;
      });

      return acc.concat(results);
    }, []);

    // Sort villages.
    villages = _.sortBy(villages, sortField);
    if (!asc) {
      villages.reverse();
    }

    const renderTh = (title, field) => {
      let cl = c('table__sort', {
        'table__sort--none': sortField !== field,
        'table__sort--asc': sortField === field && asc,
        'table__sort--desc': sortField === field && !asc
      });

      return (
        <th><a href='#' className={cl} title={t(`Sort by ${title}`)} onClick={this.setRawSort.bind(null, field)}>{title}</a></th>
      );
    };

    return (
      <div>
        <h2 className='inpage__section-title'>Village level raw data </h2>

        <section className='card card--analysis-result'>
          <div className='card__contents'>
            <header className='card__header visually-hidden'>
              <h1 className='card__title'>All Villages</h1>
            </header>
            <div className='card__body'>
              <div className='table-wrapper'>
                <table className='table'>
                  <thead>
                    <tr>
                      {renderTh('Village', 'name')}
                      {renderTh('Admin area', 'aa')}
                      {renderTh('Population', 'population')}
                      {renderTh('Time to POI', 'poi.pointOfInterest')}
                    </tr>
                  </thead>
                  <tbody>
                    {villages.map(o => (
                      <tr key={_.kebabCase(`${o.aa}-${o.lat}-${o.lng}`)}>
                        <th>{o.name || 'N/A'}</th>
                        <td>{o.aa}</td>
                        <td>{o.population || 'N/A'}</td>
                        <td>{toTimeStr(o.poi.pointOfInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
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
        {this.renderRawResultsTable()}
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
