'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import c from 'classnames';
import ReactPaginate from 'react-paginate';

import {
  fetchScenarioResults,
  fetchScenarioResultsRaw,
  fetchScenarioResultsGeo,
  showAlert
} from '../../actions';
import { round, toTimeStr } from '../../utils/utils';
import { t } from '../../utils/i18n';
import { showGlobalLoading, hideGlobalLoading } from '../global-loading';

import ResultsMap from './scenario-results-map';
import Dropdown from '../dropdown';

const ScenarioResults = React.createClass({

  propTypes: {
    projectId: T.number,
    scenarioId: T.number,
    bbox: T.array,
    aggregatedResults: T.object,
    rawResults: T.object,
    geojsonResults: T.object,
    poiTypes: T.array,
    popInd: T.array,
    _fetchScenarioResults: T.func,
    _fetchScenarioResultsRaw: T.func,
    _fetchScenarioResultsGeo: T.func,
    _showAlert: T.func
  },

  getInitialState: function () {
    return {
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      rawPage: 1,
      activePoiType: this.props.poiTypes[0].key,
      activePopInd: this.props.popInd[0].key
    };
  },

  componentDidMount: function () {
    showGlobalLoading();

    let filters = {
      poiType: this.state.activePoiType,
      popInd: this.state.activePopInd
    };

    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, filters);
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, 1, filters);
    this.props._fetchScenarioResultsGeo(this.props.projectId, this.props.scenarioId);
  },

  componentWillReceiveProps: function (nextProps) {
    let currAggregated = this.props.aggregatedResults;
    let nextAggregated = nextProps.aggregatedResults;
    let currRaw = this.props.rawResults;
    let nextRaw = nextProps.rawResults;
    let currGeoJSON = this.props.geojsonResults;
    let nextGeoJSON = nextProps.geojsonResults;

    if ((!currAggregated.fetched && nextAggregated.fetched) || (!currRaw.fetched && nextRaw.fetched) || (!currGeoJSON.fetched && nextGeoJSON.fetched)) {
      hideGlobalLoading();
      let e = nextAggregated.error || nextRaw.error || nextGeoJSON.error;
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

  onFilterChange: function (field, value, event) {
    event.preventDefault();
    this.setState({
      [field]: value,
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      rawPage: 1
    }, () => {
      this.requestRawResults();
      this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, {
        poiType: this.state.activePoiType,
        popInd: this.state.activePopInd
      });
      this.props._fetchScenarioResultsGeo(this.props.projectId, this.props.scenarioId);
    });
  },

  requestRawResults: function () {
    showGlobalLoading();
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, this.state.rawPage, {
      sortBy: this.state.rawSort.field,
      sortDir: this.state.rawSort.asc ? 'asc' : 'desc',
      poiType: this.state.activePoiType,
      popInd: this.state.activePopInd
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

    let popLabel = data.results.length ? this.props.popInd.find(o => o.key === data.results[0].pop_key).label : t('Population');

    return (
      <article className='card card--analysis-result'>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>Origin level raw data</h1>
          </header>

          <div className='card__body'>
            <div className='table-wrapper'>
              <table className='table'>
                <thead>
                  <tr>
                    {renderTh('Origin', 'origin_name')}
                    {renderTh('Admin area', 'aa_name')}
                    {renderTh(popLabel, 'pop_value')}
                    {renderTh('Time to POI', 'time_to_poi')}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map(o => (
                    <tr key={`${o.origin_id}-${o.poi_type}`}>
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
      </article>
    );
  },

  renderFilters: function () {
    let activePopIndLabel = this.props.popInd.find(o => o.key === this.state.activePopInd).label;
    let activePoiTypeLabel = this.props.poiTypes.find(o => o.key === this.state.activePoiType).label;

    return (
      <nav className='inpage__sec-nav'>
        <dl className='filters-menu'>
          <dt>{t('Population')}</dt>
          <dd>
            <Dropdown
              triggerClassName='button button--achromic drop__toggle--caret'
              triggerActiveClassName='button--active'
              triggerText={activePopIndLabel}
              triggerTitle={t('Change Population')}
              direction='down'
              alignment='left' >
                <ul className='drop__menu drop__menu--select' role='menu'>
                  {this.props.popInd.map(o => (
                    <li key={o.key}>
                      <a
                        href='#'
                        title={t('Select Population')}
                        className={c('drop__menu-item', {'drop__menu-item--active': o.key === this.state.activePopInd})}
                        onClick={this.onFilterChange.bind(this, 'activePopInd', o.key)} >
                        <span>{o.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
            </Dropdown>
          </dd>
          <dt>{t('Point of Interest')}</dt>
          <dd>
            <Dropdown
              triggerClassName='button button--achromic drop__toggle--caret'
              triggerActiveClassName='button--active'
              triggerText={activePoiTypeLabel}
              triggerTitle={t('Change Point of Interest')}
              direction='down'
              alignment='left' >
                <ul className='drop__menu drop__menu--select' role='menu'>
                  {this.props.poiTypes.map(o => (
                    <li key={o.key}>
                      <a
                        href='#'
                        title={t('Select Point of Interest')}
                        className={c('drop__menu-item', {'drop__menu-item--active': o.key === this.state.activePoiType})}
                        onClick={this.onFilterChange.bind(this, 'activePoiType', o.key)} >
                        <span>{o.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
            </Dropdown>
          </dd>
        </dl>
      </nav>
    );
  },

  render: function () {
    return (
      <div className='rwrapper'>
        {this.renderFilters()}
        <ResultsMap
          data={this.props.geojsonResults}
          bbox={this.props.bbox}
        />
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
  let popInd = state.projectItem.data.sourceData.origins.files[0].data.indicators;
  let poiTypes = state.scenarioItem.data.sourceData.poi.files.map(o => ({key: o.subtype, label: o.subtype}));

  return {
    projectId: state.projectItem.data.id,
    bbox: state.projectItem.data.bbox,
    scenarioId: state.scenarioItem.data.id,
    popInd,
    poiTypes,
    aggregatedResults: state.scenarioResults,
    rawResults: state.scenarioResultsRaw,
    geojsonResults: state.scenarioResultsGeo
  };
}

function dispatcher (dispatch) {
  return {
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args)),
    _fetchScenarioResultsRaw: (...args) => dispatch(fetchScenarioResultsRaw(...args)),
    _fetchScenarioResultsGeo: (...args) => dispatch(fetchScenarioResultsGeo(...args)),
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
      <article className='card card--analysis-result' key={accessibilityTime.poi}>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>{accessibilityTime.poi === 'pointOfInterest' ? 'Assorted' : accessibilityTime.poi}</h1>
          </header>
          <div className='card__body'>
            <div className='table-wrapper'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>{t('Admin area')}</th>
                    {accessibilityTime.analysisMins.map((o, i) => <th key={o}>{t('{min} min', {min: o})}</th>)}
                  </tr>
                </thead>
                <tbody>
                {accessibilityTime.adminAreas.map(aa => this.renderAccessibilityTableRow(accessibilityTime, aa))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </article>
    );
  }
}

AccessibilityTable.propTypes = {
  fetched: T.bool,
  fetching: T.bool,
  data: T.object,
  error: T.object
};
