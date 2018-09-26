'use strict';
// This is a connected component.
import React, { PropTypes as T } from 'react';
import { connect } from 'react-redux';
import c from 'classnames';
import _ from 'lodash';
import ReactPaginate from 'react-paginate';
import ReactTooltip from 'react-tooltip';

import {
  fetchScenarioResults,
  fetchScenarioResultsRaw,
  fetchScenarioResultsGeo,
  fetchScenarioPoi,
  invalidateScenarioPoi,
  invalidateScenarioResultsRaw,
  invalidateScenarioResultsGeo,
  showAlert,
  fetchProjectScenarios,
  fetchScenarioCompare,
  invalidateScenarioCompare
} from '../../actions';
import { round, toTimeStr, clone } from '../../utils/utils';
import { t, getLanguage } from '../../utils/i18n';
import { poiOsmTypes } from '../../utils/constants';
import { showGlobalLoadingCounted, hideGlobalLoadingCounted } from '../global-loading';

import ResultsMap from './scenario-results-map';
import Dropdown from '../dropdown';
import Alert from '../alert';

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
    scenarios: T.object,
    scenarioResCompare: T.object,
    _fetchScenarioResults: T.func,
    _fetchScenarioResultsRaw: T.func,
    _fetchScenarioResultsGeo: T.func,
    _fetchScenarioPoi: T.func,
    _invalidateScenarioResultsRaw: T.func,
    _invalidateScenarioResultsGeo: T.func,
    _invalidateScenarioPoi: T.func,
    _fetchProjectScenarios: T.func,
    _fetchScenarioCompare: T.func,
    _invalidateScenarioCompare: T.func,
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
      activePopInd: this.props.popInd[0].key,
      compare: null,
      showCompareAlert: true
    };
  },

  componentDidMount: function () {
    this.requestRawResultsDebounced = _.debounce(this.requestRawResults, 300);

    showGlobalLoadingCounted();
    this.props._fetchProjectScenarios(this.props.projectId);

    this.requestAllResults();
  },

  componentWillUnmount: function () {
    this.props._invalidateScenarioResultsRaw();
    this.props._invalidateScenarioResultsGeo();
    this.props._invalidateScenarioPoi();
    this.props._invalidateScenarioCompare();
  },

  componentWillReceiveProps: function (nextProps) {
    // Check if resource is loaded and show error if it happened.
    const checkLoaded = (curr, next) => {
      if (!curr.fetched && next.fetched) {
        hideGlobalLoadingCounted();
        if (next.error) {
          this.props._showAlert('danger', <p>{t('An error occurred while loading the results - {reason}', {reason: next.error.message})}</p>, true);
        }
      }
    };

    checkLoaded(this.props.aggregatedResults, nextProps.aggregatedResults);
    checkLoaded(this.props.rawResults, nextProps.rawResults);
    checkLoaded(this.props.geojsonResults, nextProps.geojsonResults);
    checkLoaded(this.props.scenarioPoi, nextProps.scenarioPoi);
    checkLoaded(this.props.scenarios, nextProps.scenarios);

    checkLoaded(this.props.scenarioResCompare, nextProps.scenarioResCompare);
  },

  requestAllResults: function () {
    let filters = {
      poiType: this.state.activePoiType,
      popInd: this.state.activePopInd
    };

    let filtersRaw = Object.assign({}, filters, {
      sortBy: this.state.rawSort.field,
      sortDir: this.state.rawSort.asc ? 'asc' : 'desc'
    });

    // A loading is needed for each resource.
    showGlobalLoadingCounted();
    this.props._fetchScenarioResults(this.props.projectId, this.props.scenarioId, filters);
    showGlobalLoadingCounted();
    this.props._fetchScenarioResultsRaw(this.props.projectId, this.props.scenarioId, this.state.rawPage, filtersRaw);
    showGlobalLoadingCounted();
    this.props._fetchScenarioResultsGeo(this.props.projectId, this.props.scenarioId, filters);
    showGlobalLoadingCounted();
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

  onCompareChange: function (id, event) {
    event.preventDefault();

    // On compare change, re-enable the compare alert in case it was dismissed.
    this.setState({compare: id, showCompareAlert: true}, () => {
      if (id !== null) {
        showGlobalLoadingCounted();
        this.props._fetchScenarioCompare(this.props.projectId, id, {
          poiType: this.state.activePoiType,
          popInd: this.state.activePopInd
        });
      } else {
        this.props._invalidateScenarioCompare();
      }
    });
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

    this.setState(state, () => {
      this.requestAllResults();
      if (this.state.compare !== null) {
        showGlobalLoadingCounted();
        this.props._fetchScenarioCompare(this.props.projectId, this.state.compare, {
          poiType: this.state.activePoiType,
          popInd: this.state.activePopInd
        });
      }
    });
  },

  getCompareStatus: function () {
    // Use the results to check what's the compare status.
    // Return values:
    // @return null - not comparing or data not loaded.
    // @return 1 - perfect compare. All data is available both sides
    // @return 0 - partial compare. Some data omitted.
    // @return -1 - impossible to compare. There's no common data.

    // Are we comparing?
    if (this.state.compare !== null) {
      // Do we have data?
      if (this.props.scenarioResCompare.fetched) {
        // Get the features form the base scenario that are also present in the
        // one we're comparing to.
        let baseAA = this.props.aggregatedResults.data.accessibilityTime.adminAreas;
        let comparingAA = this.props.scenarioResCompare.data.analysis.accessibilityTime.adminAreas;
        let commonAA = baseAA.reduce((acc, aa) => {
          return comparingAA.find(o => o.id === aa.id) ? acc.concat(aa.id) : acc;
        }, []);

        if (commonAA.length === baseAA.length) {
          return 1;
        } else if (commonAA.length === 0) {
          return -1;
        } else if (commonAA.length < baseAA.length) {
          return 0;
        }
      }
    }

    return null;
  },

  getMapData: function (comparing) {
    if (comparing) {
      // Do we have data for the map?
      if (this.props.scenarioResCompare.fetched) {
        // Get the features form the base scenario that are also present in the
        // one we're comparing to.
        let baseFeatures = this.props.geojsonResults.data.features;
        let comparingFeatures = this.props.scenarioResCompare.data.geo.features;
        let commonFeat = baseFeatures.reduce((acc, feat) => {
          let cmpfeat = comparingFeatures.find(f => f.properties.i === feat.properties.i);
          if (cmpfeat) {
            feat = clone(feat);
            feat.properties.e2 = cmpfeat.properties.e;
            feat.properties.eDelta = feat.properties.e - feat.properties.e2;

            acc.push(feat);
          }
          return acc;
        }, []);

        let mapData = clone(this.props.geojsonResults);
        mapData.receivedAt = this.props.scenarioResCompare.receivedAt;
        mapData.data.features = commonFeat;

        return mapData;
      }
    }

    return this.props.geojsonResults;
  },

  getAccessibilityData: function (comparing) {
    let accessibilityTableData = this.props.aggregatedResults.data.accessibilityTime;
    // Are we comparing?
    if (comparing) {
      // Do we have data for the table?
      if (this.props.scenarioResCompare.fetched) {
        // Get the features form the base scenario that are also present in the
        // one we're comparing to.
        let baseAA = this.props.aggregatedResults.data.accessibilityTime.adminAreas;
        let comparingAA = this.props.scenarioResCompare.data.analysis.accessibilityTime.adminAreas;

        let commonAA = baseAA.reduce((acc, aa) => {
          let cmpAA = comparingAA.find(o => o.id === aa.id);
          if (cmpAA) {
            aa = clone(aa);
            aa.dataCompare = cmpAA;
            return acc.concat(aa);
          }
          return acc;
        }, []);

        // Replace Admin Areas.
        accessibilityTableData = clone(this.props.aggregatedResults.data.accessibilityTime);
        accessibilityTableData.adminAreas = commonAA;
      }
    }

    return accessibilityTableData;
  },

  renderCompareAlert: function (compareStatus) {
    if (!this.state.compare || !this.state.showCompareAlert) {
      return null;
    }
    let type;
    let title;
    let message;

    if (compareStatus === 0) {
      type = 'info';
      title = t('Results Incomplete');
      message = t('Only the results present in both scenarios are being shown.');
    } else if (compareStatus === -1) {
      type = 'danger';
      title = t('Impossible to Compare');
      message = t('There are no common results between the selected scenario.');
    } else {
      return null;
    }

    return (
      <Alert type={type} dismissable onDismiss={() => this.setState({showCompareAlert: false})}>
        <h6>{title}</h6>
        <p>{message}</p>
      </Alert>
    );
  },

  render: function () {
    const poiName = this.props.poiTypes.find(o => o.key === this.state.activePoiType).label;
    const popIndName = this.props.popInd.find(o => o.key === this.state.activePopInd).label;

    // Are we comparing?
    const comparing = this.state.compare !== null;
    const compareStatus = this.getCompareStatus();
    const scenarioCompareName = this.state.compare ? this.props.scenarios.data.results.find(o => o.id === this.state.compare).name : null;

    const scenarios = this.props.scenarios.data.results
      // Can't compare to itself.
      .filter(o => o.id !== this.props.scenarioId)
      .map(o => ({id: o.id, name: o.name}));

    const mapData = this.getMapData(comparing);
    const accessibilityData = this.getAccessibilityData(comparing);

    return (
      <div className='rwrapper'>

        <FiltersBar
          onFilterChange={this.onFilterChange}
          onCompareChange={this.onCompareChange}
          activePopInd={this.state.activePopInd}
          activePoiType={this.state.activePoiType}
          popInd={this.props.popInd}
          poiTypes={this.props.poiTypes}
          scenarios={scenarios}
          compareScenarioId={this.state.compare}
          lang={getLanguage()}
        />

        {this.renderCompareAlert(compareStatus)}

        {compareStatus !== -1 ? <ResultsMap
          projectId={this.props.projectId}
          scenarioId={this.props.scenarioId}
          data={mapData}
          poi={this.props.scenarioPoi}
          bbox={this.props.bbox}
          poiName={poiName}
          popIndName={popIndName}
          comparing={comparing}
          compareScenarioName={scenarioCompareName}
        /> : null}

        {compareStatus !== -1 ? <AccessibilityTable
          fetched={this.props.aggregatedResults.fetched}
          fetching={this.props.aggregatedResults.fetching}
          receivedAt={this.props.aggregatedResults.receivedAt}
          data={accessibilityData}
          poiName={poiName}
          error={this.props.aggregatedResults.error}
          comparing={comparing}
          compareScenarioName={scenarioCompareName}
          lang={getLanguage()}
        /> : null}

        {!comparing ? <RawResultsTable
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
          lang={getLanguage()}
        /> : null}
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
      label: poiOsmTypes().find(poi => poi.key === o).value
    }));
  } else if (poiSource.type === 'wbcatalog') {
    poiTypes = poiSource.wbCatalogOptions.resources.map(o => ({
      key: o.label,
      label: o.label
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
    scenarioPoi: state.scenarioPoi,
    scenarios: state.scenarios,
    scenarioResCompare: state.scenarioResultsCompare
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
    _fetchProjectScenarios: (...args) => dispatch(fetchProjectScenarios(...args)),
    _fetchScenarioCompare: (...args) => dispatch(fetchScenarioCompare(...args)),
    _invalidateScenarioCompare: (...args) => dispatch(invalidateScenarioCompare(...args)),
    _showAlert: (...args) => dispatch(showAlert(...args))
  };
}

module.exports = connect(selector, dispatcher)(ScenarioResults);

// ////////////////////////////////////////////////////////////////////////// //
//                        Accessibility Table                                 //
// ////////////////////////////////////////////////////////////////////////// //

const AccessibilityTableEmptyRow = ({header, colSpan}) => (
  <tr>
    <th>{header}</th>
    <td className='table__empty-cell' colSpan={colSpan}>{t('No data.')}</td>
  </tr>
);
AccessibilityTableEmptyRow.propTypes = {
  colSpan: T.number,
  header: T.string
};

const AccessibilityTableCompareCell = ({value, compareValue, scenarioCompareName}) => {
  const diff = value - compareValue;
  let compareClass = 'pchange--equal';
  if (diff <= -25) {
    compareClass = 'pchange--down2x';
  } else if (diff < 0) {
    compareClass = 'pchange--down';
  } else if (diff >= 25) {
    compareClass = 'pchange--up2x';
  } else if (diff > 0) {
    compareClass = 'pchange--up';
  }
  return (
    <td>
      <span className='value-wrapper' data-tip={`${scenarioCompareName}: ${round(compareValue)}%`} data-effect='solid'>
        <small className={`pchange ${compareClass}`}>{t('(increase)')}</small> {value}%
        <ReactTooltip />
      </span>
    </td>
  );
};
AccessibilityTableCompareCell.propTypes = {
  value: T.number,
  compareValue: T.number,
  scenarioCompareName: T.string
};

class AccessibilityTable extends React.PureComponent {
  getCompareClass (curr, compare) {
    const diff = curr - compare;
    if (diff <= -25) {
      return 'pchange--down2x';
    } else if (diff < 0) {
      return 'pchange--down';
    } else if (diff >= 25) {
      return 'pchange--up2x';
    } else if (diff > 0) {
      return 'pchange--up';
    }
    return 'pchange--equal';
  }

  renderAccessibilityTableRow (accessibilityTime, aa) {
    // The server returns the raw amount of people that have access to the poi.
    // The percentage has to be calculated client side. This is to prevent
    // skewed values when comparing scenarios.
    if (!aa.pop.length) {
      return (
        <AccessibilityTableEmptyRow
          key={aa.id}
          colSpan={accessibilityTime.analysisMins.length}
          header={aa.name} />
      );
    }
    return (
      <tr key={aa.id}>
        <th>{aa.name}</th>
        {aa.pop.map((o, i) => {
          const value = round(o / aa.totalPop * 100);

          if (this.props.comparing && aa.dataCompare) {
            return (
              <AccessibilityTableCompareCell
                key={i}
                value={value}
                compareValue={round(aa.dataCompare.pop[i] / aa.dataCompare.totalPop * 100)}
                scenarioCompareName={this.props.compareScenarioName} />
            );
          }

          return (
            <td key={i}>{value}%</td>
          );
        })}
      </tr>
    );
  }

  renderAccessibilityTotalsRow (accessibilityTime) {
    // The server returns the raw amount of people that have access to the poi.
    // The percentage has to be calculated client side. This is to prevent
    // skewed values when comparing scenarios.
    const sumPop = (propPath) => accessibilityTime.adminAreas.reduce((acc, aa) => acc + _.get(aa, propPath, 0), 0);
    // Use the total pop count to determine if there's data.
    const totalPop = sumPop('totalPop');
    if (!totalPop) {
      return (
        <AccessibilityTableEmptyRow
          colSpan={accessibilityTime.analysisMins.length}
          header={t('Total')} />
      );
    }

    return (
      <tr>
        <th>{t('Total')}</th>
        {accessibilityTime.analysisMins.map((o, i) => {
          const popForMin = sumPop(['pop', i]);
          const value = round(popForMin / totalPop * 100);

          if (this.props.comparing) {
            const totalPopCompare = sumPop(['dataCompare', 'totalPop']);
            if (totalPopCompare) {
              const popForMinCompare = sumPop(['dataCompare', 'pop', i]);
              return (
                <AccessibilityTableCompareCell
                  key={i}
                  value={value}
                  compareValue={round(popForMinCompare / totalPopCompare * 100)}
                  scenarioCompareName={this.props.compareScenarioName} />
              );
            }
          }

          return (
            <td key={i}>{value}%</td>
          );
        })}
      </tr>
    );
  }

  render () {
    if (!this.props.receivedAt && (!this.props.fetched || this.props.fetching)) {
      return null;
    }

    if (this.props.error) {
      return null;
    }

    const accessibilityTime = this.props.data;

    return (
      <article className='card card--analysis-result' key={accessibilityTime.poi}>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>{t('Percentage of population with access to {poi}', {poi: this.props.poiName})}</h1>
          </header>
          <div className='card__body'>
            <div className='table-wrapper'>
              <table className='table table--has-total'>
                <thead>
                  <tr>
                    <th>{t('Admin area')}</th>
                    {accessibilityTime.analysisMins.map((o, i) => <th key={o}>{t('{min} min', {min: o})}</th>)}
                  </tr>
                </thead>
                <tbody>
                {accessibilityTime.adminAreas.map(aa => this.renderAccessibilityTableRow(accessibilityTime, aa))}
                {this.renderAccessibilityTotalsRow(accessibilityTime)}
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
  error: T.object,
  comparing: T.bool,
  compareScenarioName: T.string
};

// ////////////////////////////////////////////////////////////////////////// //
//                              Filters Bar                                   //
// ////////////////////////////////////////////////////////////////////////// //

class FiltersBar extends React.PureComponent {
  render () {
    let activePopIndLabel = this.props.popInd.find(o => o.key === this.props.activePopInd).label;
    let activePoiTypeLabel = this.props.poiTypes.find(o => o.key === this.props.activePoiType).label;
    let activeScenarioName = this.props.scenarios.find(o => o.id === this.props.compareScenarioId);
    activeScenarioName = activeScenarioName ? activeScenarioName.name : t('None');

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
                        data-hook='dropdown:close'
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
              triggerTitle={t('Choose a scenario to compare')}
              direction='down'
              alignment='left' >
                <ul className='drop__menu drop__menu--select' role='menu'>
                  {this.props.poiTypes.map(o => (
                    <li key={o.key}>
                      <a
                        href='#'
                        title={t('Select Point of Interest')}
                        className={c('drop__menu-item', {'drop__menu-item--active': o.key === this.props.activePoiType})}
                        data-hook='dropdown:close'
                        onClick={e => this.props.onFilterChange('activePoiType', o.key, e)} >
                        <span>{o.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
            </Dropdown>
          </dd>
        </dl>
        <dl className='filters-menu'>
          <dt>{t('Compare to')}</dt>
          <dd>
            <Dropdown
              triggerClassName='button button--achromic drop__toggle--caret'
              triggerActiveClassName='button--active'
              triggerText={activeScenarioName}
              triggerTitle={t('Change scenario to compare')}
              direction='down'
              alignment='left' >
                <ul className='drop__menu drop__menu--select' role='menu'>
                  <li><a
                    href='#'
                    title={t('Select scenario')}
                    className={c('drop__menu-item', {'drop__menu-item--active': this.props.compareScenarioId === null})}
                    data-hook='dropdown:close'
                    onClick={e => this.props.onCompareChange(null, e)} >
                    <span>None</span>
                  </a></li>
                  {this.props.scenarios.map(o => (
                    <li key={o.id}>
                      <a
                        href='#'
                        title={t('Select scenario')}
                        className={c('drop__menu-item', {'drop__menu-item--active': o.id === this.props.compareScenarioId})}
                        data-hook='dropdown:close'
                        onClick={e => this.props.onCompareChange(o.id, e)} >
                        <span>{o.name}</span>
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
  onCompareChange: T.func,
  activePopInd: T.string,
  activePoiType: T.string,
  popInd: T.array,
  poiTypes: T.array,
  scenarios: T.array,
  compareScenarioId: T.number
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
        <th><a href='#' className={cl} title={t(`Sort by {title}`, {title})} onClick={e => this.props.setRawSort(field, e)}>{title}</a></th>
      );
    };

    let popLabel = data.results.length ? this.props.popInd.find(o => o.key === data.results[0].pop_key).label : t('Population');

    return (
      <article className='card card--analysis-result'>
        <div className='card__contents'>
          <header className='card__header'>
            <div className='card__headline'>
              <h1 className='card__title'>{t('Travel times to {poi} by origin', {poi: this.props.poiName})}</h1>
            </div>
            <div className='card__actions'>
              <div className='form__group card__search-block'>
                <label className='form__label visually-hidden' htmlFor='search-origins'>{t('Search origins')}</label>
                <div className='form__input-group form__input-group--small'>
                  <div className='form__input-addon'><button type='button' className='button button--primary-plain button--text-hidden' title={t('Search origins')}><i className='collecticon-magnifier-left'></i><span>{t('Search')}</span></button></div>
                  <input type='text' id='search-origins' name='search-origins' className='form__control' placeholder={t('Origins')} value={this.props.filter.value} onChange={this.onSearchChange.bind(this)} />
                </div>
              </div>
            </div>
          </header>

          <div className='card__body'>

            {data.results.length === 0 && (
              <div className='card__status card__status--empty'>
                <p>{t('No results found.')}</p>
              </div>
            )}

            {data.results.length !== 0 && (
              <div className='table-wrapper'>
                <table className='table'>
                  <thead>
                    <tr>
                      {renderTh(t('Origin'), 'origin_name')}
                      {renderTh(t('Admin area'), 'aa_name')}
                      {renderTh(popLabel, 'pop_value')}
                      {renderTh(t('Time to POI'), 'time_to_poi')}
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map(o => (
                      <tr key={`${o.origin_id}-${o.poi_type}`}>
                        <th>{o.origin_name || t('N/A')}</th>
                        <td>{o.aa_name}</td>
                        <td>{o.pop_value || t('N/A')}</td>
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
                  previousLabel={<span>{t('previous')}</span>}
                  nextLabel={<span>{t('next')}</span>}
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
