import { REQUEST_SCENARIO_RESULTS_GEO, RECEIVE_SCENARIO_RESULTS_GEO } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case REQUEST_SCENARIO_RESULTS_GEO:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_RESULTS_GEO:
      state = Object.assign({}, state, { fetching: false, fetched: true, receivedAt: action.receivedAt });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = {
          'geojson': {
            'type': 'FeatureCollection',
            'features': generateGeoJSON(action.data)
          }
        };
      }
      break;
  }
  return state;
}

/*
 * Generate a GeoJSON from an array of result objects
 */
function generateGeoJSON (data) {
  return data.map(f => {
    return {
      'type': 'Feature',
      'properties': f,
      'geometry': {
        'type': 'Point',
        'coordinates': f.c
      }
    };
  });
}
