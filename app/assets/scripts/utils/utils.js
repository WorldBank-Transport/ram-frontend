'use strict';
import React from 'react';
import _ from 'lodash';
import c from 'classnames';

export function prettyPrint (obj) {
  return (
    <pre>{JSON.stringify(obj, null, '  ')}</pre>
  );
}

/**
 * Checks the fetching status of the input data.
 * @param Data structure as used by the reducer:
 *   {
 *     fetching: boolean,
 *     fetched: boolean,
 *     data: {}
 *     error: object | null
 *   }
 * @return Unified object with the combined result:
 *   {
 *     fetched: boolean
 *     fetching: boolean
 *     error: object | null
 *   }
 */
export function fetchStatus (...data) {
  let fetched = true;
  let fetching = false;
  let error = null;
  data.forEach(o => {
    // One not fetched and all is false.
    fetched = !o.fetched ? false : fetched;
    // One fetching and all is fetching.
    fetching = o.fetching ? true : fetching;
    error = o.error ? o.error : error;
  });

  return { fetched, fetching, error };
}

export function percent (value, total, decimals = 2) {
  let val = value / total * 100;
  return round(val, decimals);
}

export function round (value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function limitHelper (charLimit) {
  return (currLength) => {
    let remaining = charLimit - currLength;

    let cl = _.curry(c, 2)({
      'form__limit--near': remaining < 10,
      'form__limit--reached': remaining < 0
    });

    return { c: cl, remaining };
  };
}
