import fetch from 'isomorphic-fetch';

import config from '../config';

// Fetcher function

function f (url, options, requestFn, receiveFn) {
  return function (dispatch, getState) {
    dispatch(requestFn());

    fetch(url, options)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      })
      .then(json => {
        dispatch(receiveFn(json));
      }, e => {
        console.log('e', e);
        return dispatch(receiveFn(null, 'Data not available'));
      });
  };
}

function fetcher (url, requestFn, receiveFn) {
  return f(url, null, requestFn, receiveFn);
}
