'use strict';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

export const reducers = {
};

export default combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));
