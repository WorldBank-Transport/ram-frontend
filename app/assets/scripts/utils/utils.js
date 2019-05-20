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

    return { c: cl, remaining, isOk: () => remaining >= 0 };
  };
}

export function toTimeStr (value) {
  if (isNaN(value) || value === null) {
    return 'n/a';
  }

  let remainder = value;
  let hours = Math.floor(remainder / 3600);
  remainder %= 3600;
  let minutes = Math.round(remainder / 60);
  // remainder %= 60;
  // let seconds = Math.round(remainder);

  let pieces = [];
  if (hours) {
    pieces.push(hours < 10 ? `0${hours}H` : `${hours}H`);
    pieces.push(minutes < 10 ? `0${minutes}M` : `${minutes}M`);
  } else if (minutes) {
    pieces.push(minutes < 10 ? `0${minutes}M` : `${minutes}M`);
  } else {
    return '<1M';
  }

  // if (seconds) {
  //   pieces.push(seconds < 10 ? `0${seconds}S` : `${seconds}S`);
  // }

  return pieces.join(' ');
}

export function scenarioHasResults (scenario) {
  return scenario.gen_analysis &&
    scenario.gen_analysis.status === 'complete' &&
    _.last(scenario.gen_analysis.logs).code === 'success';
}

export function storePrevPath (location) {
  let qs = location.search.slice(1);
  let params = {};
  qs.split('&').forEach((query) => {
    let kv = query.split('=');
    params[kv[0]] = kv[1];
  });

  let prevPath = params['return'] || '/';
  localStorage.setItem('prev_path', prevPath);
}

export function popPrevPath () {
  let prevPath = localStorage.getItem('prev_path');
  localStorage.removeItem('prev_path');
  return prevPath;
}

export function clone (o) {
  return JSON.parse(JSON.stringify(o));
}

export function getPropInsensitive (object, prop) {
  // prop can be written in caps or any variant.
  // prop, PROP, Prop, PrOp
  // Search for the first match an return it.
  // If not found return prop.
  return Object.keys(object).find(k => k.toLowerCase() === prop) || prop;
}

export function readFileAsJSON (file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onerror = err => reject(err);

    reader.onload = e => {
      try {
        let json = JSON.parse(e.target.result);
        return resolve(json);
      } catch (err) {
        return reject(err);
      }
    };

    reader.readAsText(file);
  });
}

/**
 * Extracts all the coordinates of a type from an array.
 * Assumes Longitude to be the first position and latitude to be the secons.
 *
 * @param {array} arr The array which can be flat or deep like a multipolygon
 * @param {string} what What to search for (lon|lat)
 *
 * @returns {array}
 */
export function coordExtract (arr, what) {
  const mapp = {lat: 1, lon: 0};
  if (arr.length === 2 &&
    typeof arr[0] === 'number' &&
    typeof arr[1] === 'number') {
    return [arr[mapp[what]]];
  } else {
    return arr.reduce((acc, v) => {
      return [...acc, ...coordExtract(v, what)];
    }, []);
  }
}
