'use strict';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import app from './app';
import projects from './projects';
import projectItem from './project-item';
import scenarioItem from './scenario-item';
import projectForm from './project-form';

export const reducers = {
  app,
  projects,
  projectItem,
  scenarioItem,
  projectForm
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
