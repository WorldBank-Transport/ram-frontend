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
import scenarioResultsCompare from './scenario-results-compare';
import scenarioPoi from './scenario-poi';
import scenarioResultsRaw from './scenario-results-raw';
import scenarioResultsGeo from './scenario-results-geo';
import rahForm from './rah-form';
import { systemAlertsReducer } from '../components/system-alerts';
import auth from './auth';
import profileSettings from './profile-settings';
import profileSettingsForm from './profile-settings-form';

export const reducers = {
  projects,
  projectItem,
  scenarioItem,
  projectForm,
  scenarios,
  scenarioForm,
  scenarioResults,
  scenarioResultsRaw,
  scenarioResultsGeo,
  scenarioResultsCompare,
  scenarioPoi,
  systemAlertsReducer,
  rahForm,
  auth,
  profileSettings,
  profileSettingsForm
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
