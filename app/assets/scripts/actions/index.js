import fetch from 'isomorphic-fetch';

import config from '../config';

export const REQUEST_PROJECTS = 'REQUEST_PROJECTS';
export const RECEIVE_PROJECTS = 'RECEIVE_PROJECTS';
export const INVALIDATE_PROJECTS = 'INVALIDATE_PROJECTS';

export const REQUEST_PROJECT_ITEM = 'REQUEST_PROJECT_ITEM';
export const RECEIVE_PROJECT_ITEM = 'RECEIVE_PROJECT_ITEM';
export const INVALIDATE_PROJECT_ITEM = 'INVALIDATE_PROJECT_ITEM';
export const REMOVE_PROJECT_ITEM_FILE = 'REMOVE_PROJECT_ITEM_FILE';

export const REQUEST_SCENARIO_ITEM = 'REQUEST_SCENARIO_ITEM';
export const RECEIVE_SCENARIO_ITEM = 'RECEIVE_SCENARIO_ITEM';
export const INVALIDATE_SCENARIO_ITEM = 'INVALIDATE_SCENARIO_ITEM';
export const REMOVE_SCENARIO_ITEM_FILE = 'REMOVE_SCENARIO_ITEM_FILE';

// Projects

export function invalidateProjects () {
  return { type: INVALIDATE_PROJECTS };
}

export function requestProjects () {
  return { type: REQUEST_PROJECTS };
}

export function receiveProjects (projects, error = null) {
  return { type: RECEIVE_PROJECTS, data: projects, error, receivedAt: Date.now() };
}

export function fetchProjects () {
  return getAndDispatch(`${config.api}/projects`, requestProjects, receiveProjects);
}

// Project item

export function invalidateProjectItem () {
  return { type: INVALIDATE_PROJECT_ITEM };
}

export function requestProjectItem () {
  return { type: REQUEST_PROJECT_ITEM };
}

export function receiveProjectItem (project, error = null) {
  return { type: RECEIVE_PROJECT_ITEM, data: project, error, receivedAt: Date.now() };
}

export function fetchProjectItem (id) {
  return getAndDispatch(`${config.api}/projects/${id}`, requestProjectItem, receiveProjectItem);
}

// Removes the given file id from the projects file array, avoiding a
// new request.
export function removeProjectItemFile (fileId) {
  return { type: REMOVE_PROJECT_ITEM_FILE, fileId };
}

// Scenario item

export function invalidateScenarioItem () {
  return { type: INVALIDATE_SCENARIO_ITEM };
}

export function requestScenarioItem () {
  return { type: REQUEST_SCENARIO_ITEM };
}

export function receiveScenarioItem (scenario, error = null) {
  return { type: RECEIVE_SCENARIO_ITEM, data: scenario, error, receivedAt: Date.now() };
}

export function fetchScenarioItem (pid, scid) {
  return getAndDispatch(`${config.api}/projects/${pid}/scenarios/${scid}`, requestScenarioItem, receiveScenarioItem);
}

// Removes the given file id from the scenario file array, avoiding a
// new request.
export function removeScenarioItemFile (fileId) {
  return { type: REMOVE_SCENARIO_ITEM_FILE, fileId };
}

// Fetcher function

function getAndDispatch (url, requestFn, receiveFn) {
  return fetchDispatchFactory(url, null, requestFn, receiveFn);
}

function fetchDispatchFactory (url, options, requestFn, receiveFn) {
  return function (dispatch, getState) {
    dispatch(requestFn());

    fetchJSON(url, options)
      .then(json => dispatch(receiveFn(json)), err => dispatch(receiveFn(null, err)));
  };
}

export function fetchJSON (url, options) {
  return fetch(url, options)
    .then(response => {
      return response.text().then(body => {
        var json;
        try {
          json = JSON.parse(body);
        } catch (e) {
          console.log('json parse error', e);
          return Promise.reject({
            error: e.message,
            body
          });
        }

        return response.status >= 400
          ? Promise.reject(json)
          : Promise.resolve(json);
      });
    });
}
