'use strict';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import projects from './projects';
import projectItem from './project-item';

export const reducers = {
  projects,
  projectItem
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
