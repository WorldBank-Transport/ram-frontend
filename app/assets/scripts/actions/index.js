import fetch from 'isomorphic-fetch';

import config from '../config';

export const REQUEST_PROJECTS = 'REQUEST_PROJECTS';
export const RECEIVE_PROJECTS = 'RECEIVE_PROJECTS';
export const INVALIDATE_PROJECTS = 'INVALIDATE_PROJECTS';

export const REQUEST_PROJECT_ITEM = 'REQUEST_PROJECT_ITEM';
export const RECEIVE_PROJECT_ITEM = 'RECEIVE_PROJECT_ITEM';
export const INVALIDATE_PROJECT_ITEM = 'INVALIDATE_PROJECT_ITEM';

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
  return fetcher(`${config.api}/projects`, requestProjects, receiveProjects);
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
  return fetcher(`${config.api}/projects/${id}`, requestProjectItem, receiveProjectItem);
}

// Fetcher function

function f (url, options, requestFn, receiveFn) {
  return function (dispatch, getState) {
    dispatch(requestFn());

    fetch(url, options)
      .then(response => {
        return response.text().then(body => {
          var json;
          try {
            json = JSON.parse(body);
          } catch (e) {
            console.log('json parse error', e);
            return dispatch(receiveFn(null, {
              error: e.message,
              body
            }));
          }

          if (response.status >= 400) {
            return dispatch(receiveFn(null, json));
          }

          return dispatch(receiveFn(json));
        });
      });
  };
}

function fetcher (url, requestFn, receiveFn) {
  return f(url, null, requestFn, receiveFn);
}
