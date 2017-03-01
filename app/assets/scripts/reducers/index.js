'use strict';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import projects from './projects';
import projectItem from './project-item';
import scenarioItem from './scenario-item';

export const reducers = {
  projects,
  projectItem,
  scenarioItem
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
