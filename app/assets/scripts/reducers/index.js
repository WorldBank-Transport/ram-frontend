'use strict';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import projects from './projects';
import projectItem from './project-item';
import scenarioItem from './scenario-item';
import projectForm from './project-form';
import scenarios from './scenarios';
import scenarioForm from './scenario-form';
import scenarioResults from './scenario-results';
import scenarioResultsRaw from './scenario-results-raw';
import scenarioResultsGeoJSON from './scenario-results-geojson';
import { systemAlertsReducer } from '../components/system-alerts';

export const reducers = {
  projects,
  projectItem,
  scenarioItem,
  projectForm,
  scenarios,
  scenarioForm,
  scenarioResults,
  scenarioResultsRaw,
  scenarioResultsGeoJSON,
  systemAlertsReducer
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
