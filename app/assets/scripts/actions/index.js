import fetch from 'isomorphic-fetch';

import config from '../config';

export const SHOW_GLOBAL_LOADING = 'SHOW_GLOBAL_LOADING';
export const HIDE_GLOBAL_LOADING = 'HIDE_GLOBAL_LOADING';

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

export const RESET_PROJECT_FORM = 'RESET_PROJECT_FORM';
export const START_SUBMIT_PROJECT = 'START_SUBMIT_PROJECT';
export const FINISH_SUBMIT_PROJECT = 'FINISH_SUBMIT_PROJECT';
export const START_DELETE_PROJECT = 'START_DELETE_PROJECT';
export const FINISH_DELETE_PROJECT = 'FINISH_DELETE_PROJECT';

export const REQUEST_PROJECT_SCENARIOS = 'REQUEST_PROJECT_SCENARIOS';
export const RECEIVE_PROJECT_SCENARIOS = 'RECEIVE_PROJECT_SCENARIOS';
export const INVALIDATE_PROJECT_SCENARIOS = 'INVALIDATE_PROJECT_SCENARIOS';

// App related. Global stuff

export function showGlobalLoading () {
  return { type: SHOW_GLOBAL_LOADING, time: Date.now() };
}

export function hideImmediatGlobalLoading () {
  return { type: HIDE_GLOBAL_LOADING };
}

export function hideGlobalLoading () {
  const MIN_TIME = 512;
  return (dispatch, getState) => {
    let time = getState().app.globalLoadingTime;
    if (!time) {
      return dispatch(hideImmediatGlobalLoading());
    }
    let diff = Date.now() - time;
    if (diff >= MIN_TIME) {
      return dispatch(hideImmediatGlobalLoading());
    } else {
      setTimeout(() => dispatch(hideImmediatGlobalLoading()), MIN_TIME - diff);
    }
  };
}

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

// Project Form

export function resetProjectFrom () {
  return { type: RESET_PROJECT_FORM };
}

export function startSubmitProject () {
  return { type: START_SUBMIT_PROJECT };
}

export function finishSubmitProject (project, error = null) {
  return { type: FINISH_SUBMIT_PROJECT, data: project, error, receivedAt: Date.now() };
}

export function postProject (data) {
  return postAndDispatch(`${config.api}/projects`, data, startSubmitProject, finishSubmitProject);
}

export function patchProject (projectId, data) {
  return patchAndDispatch(`${config.api}/projects/${projectId}`, data, startSubmitProject, finishSubmitProject);
}

export function startDeleteProject () {
  return { type: START_DELETE_PROJECT };
}

export function finishDeleteProject (project, error = null) {
  return { type: FINISH_DELETE_PROJECT, data: project, error, receivedAt: Date.now() };
}

export function deleteProject (projectId) {
  return deleteAndDispatch(`${config.api}/projects/${projectId}`, startDeleteProject, finishDeleteProject);
}

// Projects

export function invalidateProjectScenarios () {
  return { type: INVALIDATE_PROJECT_SCENARIOS };
}

export function requestProjectScenarios () {
  return { type: REQUEST_PROJECT_SCENARIOS };
}

export function receiveProjectScenarios (scenarios, error = null) {
  return { type: RECEIVE_PROJECT_SCENARIOS, data: scenarios, error, receivedAt: Date.now() };
}

export function fetchProjectScenarios (projectId) {
  return getAndDispatch(`${config.api}/projects/${projectId}/scenarios`, requestProjectScenarios, receiveProjectScenarios);
}

// Fetcher function

function getAndDispatch (url, requestFn, receiveFn) {
  return fetchDispatchFactory(url, null, requestFn, receiveFn);
}

function postAndDispatch (url, data, requestFn, receiveFn) {
  let opt = {
    method: 'POST',
    body: JSON.stringify(data)
  };
  return fetchDispatchFactory(url, opt, requestFn, receiveFn);
}

function patchAndDispatch (url, data, requestFn, receiveFn) {
  let opt = {
    method: 'PATCH',
    body: JSON.stringify(data)
  };
  return fetchDispatchFactory(url, opt, requestFn, receiveFn);
}

function deleteAndDispatch (url, requestFn, receiveFn) {
  let opt = {
    method: 'DELETE'
  };
  return fetchDispatchFactory(url, opt, requestFn, receiveFn);
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
      return response.text()
      // .then(body => ((new Promise(resolve => setTimeout(() => resolve(body), 1000)))))
      .then(body => {
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
