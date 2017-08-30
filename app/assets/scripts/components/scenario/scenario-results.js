'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import c from 'classnames';
import _ from 'lodash';
import ReactPaginate from 'react-paginate';

import {
  fetchScenarioResults,
  fetchScenarioResultsRaw,
  fetchScenarioResultsGeo,
  fetchScenarioPoi,
  invalidateScenarioPoi,
  invalidateScenarioResultsRaw,
  invalidateScenarioResultsGeo,
  showAlert
} from '../../actions';
import { round, toTimeStr } from '../../utils/utils';
import { t } from '../../utils/i18n';
import { poiOsmTypes } from '../../utils/constants';
import { showGlobalLoadingCounted, hideGlobalLoadingCounted } from '../global-loading';

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
    scenarioPoi: T.object,
    poiTypes: T.array,
    popInd: T.array,
    _fetchScenarioResults: T.func,
    _fetchScenarioResultsRaw: T.func,
    _fetchScenarioResultsGeo: T.func,
    _fetchScenarioPoi: T.func,
    _invalidateScenarioResultsRaw: T.func,
    _invalidateScenarioResultsGeo: T.func,
    _invalidateScenarioPoi: T.func,
    _showAlert: T.func
  },

  getInitialState: function () {
    return {
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      rawFilter: {
        field: 'origin_name',
        value: ''
      },
      rawPage: 1,
      activePoiType: this.props.poiTypes[0].key,
      activePopInd: this.props.popInd[0].key
    };
  },

  componentDidMount: function () {
    this.requestRawResultsDebounced = _.debounce(this.requestRawResults, 300);
    this.requestAllResults();
  },

  componentWillUnmount: function () {
    this.props._invalidateScenarioResultsRaw();
    this.props._invalidateScenarioResultsGeo();
    this.props._invalidateScenarioPoi();
  },

  componentWillReceiveProps: function (nextProps) {
    let currAggregated = this.props.aggregatedResults;
    let nextAggregated = nextProps.aggregatedResults;
    let currRaw = this.props.rawResults;
    let nextRaw = nextProps.rawResults;
    let currGeoJSON = this.props.geojsonResults;
    let nextGeoJSON = nextProps.geojsonResults;
    let currPoi = this.props.scenarioPoi;
    let nextPoi = nextProps.scenarioPoi;

    if ((!currAggregated.fetched && nextAggregated.fetched) ||
        (!currRaw.fetched && nextRaw.fetched) ||
        (!currGeoJSON.fetched && nextGeoJSON.fetched) ||
        (!currPoi.fetched && nextPoi.fetched)) {
      hideGlobalLoadingCounted();
      let e = nextAggregated.error || nextRaw.error || nextGeoJSON.error || nextPoi.error;
      if (e) {
        this.props._showAlert('danger', <p>{t('An error occurred while loading the results - {reason}', {reason: e.message})}</p>, true);
      }
    }
  },

  requestAllResults: function () {
    // Must load 4 items.
    showGlobalLoadingCounted(4);

    let filters = {
      poiType: this.state.activePoiType,
      popInd: this.state.activePopInd
    };

    let filtersRaw = Object.assign({}, filters, {
      sortBy: this.state.rawSort.field,
      sortDir: this.state.rawSort.asc ? 'asc' : 'desc'
    });

    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, filters);
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, this.state.rawPage, filtersRaw);
    this.props._fetchScenarioResultsGeo(this.props.projectId, this.props.scenarioId, filters);
    this.props._fetchScenarioPoi(this.props.projectId, this.props.scenarioId, {type: this.state.activePoiType});
  },

  // Debounced in componentDidMount.
  // requestRawResultsDebounced

  requestRawResults: function () {
    let query = {
      sortBy: this.state.rawSort.field,
      sortDir: this.state.rawSort.asc ? 'asc' : 'desc',
      poiType: this.state.activePoiType,
      popInd: this.state.activePopInd
    };

    if (this.state.rawFilter.value) {
      query[this.state.rawFilter.field] = this.state.rawFilter.value;
    }

    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, this.state.rawPage, query);
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
      showGlobalLoadingCounted();
      this.requestRawResults();
    });
  },

  handleRawPageChange: function (page) {
    this.setState({ rawPage: page.selected + 1 }, () => {
      showGlobalLoadingCounted();
      this.requestRawResults();
    });
  },

  onRawResultsFilter: function (field, val) {
    let state = {
      // Reset sort.
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      // Reset page.
      rawPage: 1,
      rawFilter: {
        field,
        value: val
      }
    };

    this.setState(state);

    this.requestRawResultsDebounced();
  },

  onFilterChange: function (field, value, event) {
    event.preventDefault();

    let state = {
      [field]: value,
      rawSort: {
        field: 'origin_name',
        asc: true
      },
      rawPage: 1
    };

    this.setState(state, () => { this.requestAllResults(); });
  },

  render: function () {
    let poiName = this.props.poiTypes.find(o => o.key === this.state.activePoiType).label;
    let popIndName = this.props.popInd.find(o => o.key === this.state.activePopInd).label;

    return (
      <div className='rwrapper'>

        <FiltersBar
          onFilterChange={this.onFilterChange}
          activePopInd={this.state.activePopInd}
          activePoiType={this.state.activePoiType}
          popInd={this.props.popInd}
          poiTypes={this.props.poiTypes}
        />

        <ResultsMap
          data={this.props.geojsonResults}
          poi={this.props.scenarioPoi}
          bbox={this.props.bbox}
          poiName={poiName}
          popIndName={popIndName}
        />

        <AccessibilityTable
          fetched={this.props.aggregatedResults.fetched}
          fetching={this.props.aggregatedResults.fetching}
          receivedAt={this.props.aggregatedResults.receivedAt}
          data={this.props.aggregatedResults.data.accessibilityTime}
          poiName={poiName}
          error={this.props.aggregatedResults.error}
        />

        <RawResultsTable
          fetched={this.props.rawResults.fetched}
          fetching={this.props.rawResults.fetching}
          receivedAt={this.props.rawResults.receivedAt}
          data={this.props.rawResults.data}
          error={this.props.rawResults.error}
          popInd={this.props.popInd}
          sort={this.state.rawSort}
          handleRawPageChange={this.handleRawPageChange}
          setRawSort={this.setRawSort}
          poiName={poiName}
          filter={this.state.rawFilter}
          onFilter={this.onRawResultsFilter}
        />
      </div>
    );
  }
});

function selector (state) {
  let popInd = state.projectItem.data.sourceData.origins.files[0].data.indicators;

  let poiSource = state.scenarioItem.data.sourceData.poi;
  let poiTypes;
  if (poiSource.type === 'file') {
    poiTypes = poiSource.files.map(o => ({key: o.subtype, label: o.subtype}));
  } else if (poiSource.type === 'osm') {
    // When the POI come from osm we can use the labels defined in constants.js
    poiTypes = poiSource.osmOptions.osmPoiTypes.map(o => ({
      key: o,
      label: poiOsmTypes.find(poi => poi.key === o).value
    }));
  }

  return {
    projectId: state.projectItem.data.id,
    bbox: state.projectItem.data.bbox,
    scenarioId: state.scenarioItem.data.id,
    popInd,
    poiTypes,
    aggregatedResults: state.scenarioResults,
    rawResults: state.scenarioResultsRaw,
    geojsonResults: state.scenarioResultsGeo,
    scenarioPoi: state.scenarioPoi
  };
}

function dispatcher (dispatch) {
  return {
    _fetchScenarioResults: (...args) => dispatch(fetchScenarioResults(...args)),
    _fetchScenarioResultsRaw: (...args) => dispatch(fetchScenarioResultsRaw(...args)),
    _fetchScenarioResultsGeo: (...args) => dispatch(fetchScenarioResultsGeo(...args)),
    _fetchScenarioPoi: (...args) => dispatch(fetchScenarioPoi(...args)),
    _invalidateScenarioResultsRaw: (...args) => dispatch(invalidateScenarioResultsRaw(...args)),
    _invalidateScenarioResultsGeo: (...args) => dispatch(invalidateScenarioResultsGeo(...args)),
    _invalidateScenarioPoi: (...args) => dispatch(invalidateScenarioPoi(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioResults);

// ////////////////////////////////////////////////////////////////////////// //
//                        Accessibility Table                                 //
// ////////////////////////////////////////////////////////////////////////// //

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

  render () {
    if (!this.props.receivedAt) {
      if (!this.props.fetched || this.props.fetching) {
        return null;
      }
    }

    if (this.props.error) {
      return null;
    }

    let accessibilityTime = this.props.data;

    return (
      <article className='card card--analysis-result' key={accessibilityTime.poi}>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>{this.props.poiName}</h1>
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
  receivedAt: T.number,
  data: T.object,
  poiName: T.string,
  error: T.object
};

// ////////////////////////////////////////////////////////////////////////// //
//                              Filters Bar                                   //
// ////////////////////////////////////////////////////////////////////////// //

class FiltersBar extends React.PureComponent {
  render () {
    let activePopIndLabel = this.props.popInd.find(o => o.key === this.props.activePopInd).label;
    let activePoiTypeLabel = this.props.poiTypes.find(o => o.key === this.props.activePoiType).label;

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
                        className={c('drop__menu-item', {'drop__menu-item--active': o.key === this.props.activePopInd})}
                        onClick={e => this.props.onFilterChange('activePopInd', o.key, e)} >
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
                        className={c('drop__menu-item', {'drop__menu-item--active': o.key === this.props.activePoiType})}
                        onClick={e => this.props.onFilterChange('activePoiType', o.key, e)} >
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
  }
}

FiltersBar.propTypes = {
  onFilterChange: T.func,
  activePopInd: T.string,
  activePoiType: T.string,
  popInd: T.array,
  poiTypes: T.array
};

// ////////////////////////////////////////////////////////////////////////// //
//                           Raw Results Table                                //
// ////////////////////////////////////////////////////////////////////////// //

class RawResultsTable extends React.PureComponent {
  onSearchChange (event) {
    this.props.onFilter('origin_name', event.target.value);
  }

  render () {
    let { fetched, fetching, error, data, receivedAt } = this.props;

    // On subsequent requests do not redraw.
    if (!receivedAt) {
      if (!fetched || fetching) {
        return null;
      }
    }

    if (error) {
      return null;
    }

    let { field: sortField, asc } = this.props.sort;

    const renderTh = (title, field) => {
      let cl = c('table__sort', {
        'table__sort--none': sortField !== field,
        'table__sort--asc': sortField === field && asc,
        'table__sort--desc': sortField === field && !asc
      });

      return (
        <th><a href='#' className={cl} title={t(`Sort by ${title}`)} onClick={e => this.props.setRawSort(field, e)}>{title}</a></th>
      );
    };

    let popLabel = data.results.length ? this.props.popInd.find(o => o.key === data.results[0].pop_key).label : t('Population');

    return (
      <article className='card card--analysis-result'>
        <div className='card__contents'>
          <header className='card__header'>
            <div className='card__headline'>
              <h1 className='card__title'>Origin level raw data for {this.props.poiName}</h1>
            </div>
            <div className='card__actions'>
              <div className='form__group card__search-block'>
                <label className='form__label visually-hidden' htmlFor='search-villages'>{t('Search villages')}</label>
                <div className='form__input-group form__input-group--small'>
                  <div className='form__input-addon'><button type='button' className='button button--primary-plain button--text-hidden' title='Search villages'><i className='collecticon-magnifier-left'></i><span>Search</span></button></div>
                  <input type='text' id='search-villages' name='search-villages' className='form__control' placeholder={t('Villages')} value={this.props.filter.value} onChange={this.onSearchChange.bind(this)} />
                </div>
              </div>
            </div>
          </header>

          <div className='card__body'>

            {data.results.length === 0 && (
              <div className='card__status card__status--empty'>
                <p>No results found.</p>
              </div>
            )}

            {data.results.length !== 0 && (
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
              </div>
            )}

            {data.results.length !== 0 && (
              <div className='pagination-wrapper'>
                <ReactPaginate
                  previousLabel={<span>previous</span>}
                  nextLabel={<span>next</span>}
                  breakLabel={<span className='pages__page'>...</span>}
                  pageCount={Math.ceil(data.meta.found / data.meta.limit)}
                  forcePage={data.meta.page - 1}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={this.props.handleRawPageChange}
                  containerClassName={'pagination'}
                  subContainerClassName={'pages'}
                  pageClassName={'pages__wrapper'}
                  pageLinkClassName={'pages__page'}
                  activeClassName={'active'} />
              </div>
            )}

          </div>
        </div>
      </article>
    );
  }
}

RawResultsTable.propTypes = {
  fetched: T.bool,
  fetching: T.bool,
  receivedAt: T.number,
  data: T.object,
  error: T.object,
  popInd: T.array,
  sort: T.shape({
    field: T.string,
    asc: T.bool
  }),
  setRawSort: T.func,
  handleRawPageChange: T.func,
  poiName: T.string,
  filter: T.shape({
    field: T.string,
    value: T.string
  }),
  onFilter: T.func
};
