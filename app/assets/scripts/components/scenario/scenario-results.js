'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import c from 'classnames';

import ReactPaginate from 'react-paginate';

import {
  fetchScenarioResults,
  fetchScenarioResultsRaw,
  showAlert
} from '../../actions';
import { round, toTimeStr } from '../../utils/utils';
import { t } from '../../utils/i18n';
import { showGlobalLoading, hideGlobalLoading } from '../global-loading';

const ScenarioResults = React.createClass({

  propTypes: {
    projectId: T.number,
    scenarioId: T.number,
    aggregatedResults: T.object,
    rawResults: T.object,
    _fetchScenarioResults: T.func,
    _fetchScenarioResultsRaw: T.func,
    _showAlert: T.func
  },

  getInitialState: function () {
    return {
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      rawPage: 1
    };
  },

  componentDidMount: function () {
    showGlobalLoading();
    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId);
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, 1);
  },

  componentWillReceiveProps: function (nextProps) {
    let currAggregated = this.props.aggregatedResults;
    let nextAggregated = nextProps.aggregatedResults;
    let currRaw = this.props.rawResults;
    let nextRaw = nextProps.rawResults;

    if ((!currAggregated.fetched && nextAggregated.fetched) || (!currRaw.fetched && nextRaw.fetched)) {
      hideGlobalLoading();
      let e = nextAggregated.error || nextRaw.error;
      if (e) {
        this.props._showAlert('danger', <p>{t('An error occurred while loading the results - {reason}', {reason: e.message})}</p>, true);
      }
    }
  },

  setRawSort: function (field, e) {
    e && e.preventDefault();

    let sort;
    if (field === this.state.rawSort.field) {
      sort = { field, asc: !this.state.rawSort.asc };
    } else {
      sort = { field, asc: true };
    }

    this.setState({ rawSort: sort, rawPage: 1 }, () => {
      this.requestRawResults();
    });
  },

  handleRawPageChange: function (page) {
    this.setState({ rawPage: page.selected + 1 }, () => {
      this.requestRawResults();
    });
  },

  requestRawResults: function () {
    showGlobalLoading();
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, this.state.rawPage, {
      sortBy: this.state.rawSort.field,
      sortDir: this.state.rawSort.asc ? 'asc' : 'desc'
    });
  },

  renderRawResultsTable: function () {
    let { fetched, fetching, error, data, receivedAt } = this.props.rawResults;

    // On subsequent requests do not redraw.
    if (!receivedAt) {
      if (!fetched || fetching) {
        return null;
      }

      // if (fetching) {
      //   return <p>Loading results...</p>;
      // }
    }

    if (error) {
      return null;
    }

    let { field: sortField, asc } = this.state.rawSort;

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
        <h2 className='inpage__section-title'>Origin level raw data </h2>

        <section className='card card--analysis-result'>
          <div className='card__contents'>
            <header className='card__header visually-hidden'>
              <h1 className='card__title'>All origins</h1>
            </header>
            <div className='card__body'>
              <div className='table-wrapper'>
                <table className='table'>
                  <thead>
                    <tr>
                      {renderTh('Origin', 'origin_name')}
                      {renderTh('Admin area', 'aa_name')}
                      {renderTh('Population', 'pop_value')}
                      {renderTh('Time to POI', 'time_to_poi')}
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map(o => (
                      <tr key={o.origin_id}>
                        <th>{o.origin_name || 'N/A'}</th>
                        <td>{o.aa_name}</td>
                        <td>{o.pop_value || 'N/A'}</td>
                        <td>{toTimeStr(o.time_to_poi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className='pagination-wrapper'>
                  <ReactPaginate
                    previousLabel={<span>previous</span>}
                    nextLabel={<span>next</span>}
                    breakLabel={<span className='pages__page'>...</span>}
                    pageCount={Math.ceil(data.meta.found / data.meta.limit)}
                    forcePage={data.meta.page - 1}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={this.handleRawPageChange}
                    containerClassName={'pagination'}
                    subContainerClassName={'pages'}
                    pageClassName={'pages__wrapper'}
                    pageLinkClassName={'pages__page'}
                    activeClassName={'active'} />
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    );
  },

  render: function () {
    return (
      <div>
        <AccessibilityTable
          fetched={this.props.aggregatedResults.fetched}
          fetching={this.props.aggregatedResults.fetching}
          data={this.props.aggregatedResults.data.accessibilityTime}
          error={this.props.aggregatedResults.error}
        />
        {this.renderRawResultsTable()}
      </div>
    );
  }
});

function selector (state) {
  return {
    aggregatedResults: state.scenarioResults,
    rawResults: state.scenarioResultsRaw
  };
}

function dispatcher (dispatch) {
  return {
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args)),
    _fetchScenarioResultsRaw: (...args) => dispatch(fetchScenarioResultsRaw(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioResults);

class AccessibilityTable extends React.PureComponent {
  renderAccessibilityTableRow (poi, aa) {
    if (!aa.data.length) {
      return (
        <tr key={aa.name}>
          <th>{aa.name}</th>
          <td className='table__empty-cell' colSpan={poi.analysisMins.length}>{t('No data.')}</td>
        </tr>
      );
    }

    return (
      <tr key={aa.name}>
        <th>{aa.name}</th>
        {aa.data.map((o, i) => <td key={i}>{round(o)}%</td>)}
      </tr>
    );
  }

  render (poi) {
    if (!this.props.fetched || this.props.fetching) {
      return null;
    }

    // if (this.props.fetching) {
    //   return <p>Loading results...</p>;
    // }

    if (this.props.error) {
      return null;
    }

    let accessibilityTime = this.props.data;

    return (
      <div>
        <h2 className='inpage__section-title'>Points of interest</h2>
        {accessibilityTime.map(poi => {
          return (
            <section className='card card--analysis-result' key={poi.poi}>
              <div className='card__contents'>
                <header className='card__header'>
                  <h1 className='card__title'>{poi.poi === 'pointOfInterest' ? 'Assorted' : poi.poi}</h1>
                </header>
                <div className='card__body'>
                  <div className='table-wrapper'>
                    <table className='table'>
                      <thead>
                        <tr>
                          <th>{t('Admin area')}</th>
                          {poi.analysisMins.map((o, i) => <th key={o}>{t('{min} min', {min: o})}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                      {poi.adminAreas.map(aa => this.renderAccessibilityTableRow(poi, aa))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    );
  }
}

AccessibilityTable.propTypes = {
  fetched: T.bool,
  fetching: T.bool,
  data: T.array,
  error: T.object
};
