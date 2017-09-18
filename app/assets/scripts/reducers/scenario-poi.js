import { REQUEST_SCENARIO_POI, RECEIVE_SCENARIO_POI, INVALIDATE_SCENARIO_POI } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_SCENARIO_POI:
      return Object.assign({}, state, initialState);
    case REQUEST_SCENARIO_POI:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_POI:
      state = Object.assign({}, state, { fetching: false, fetched: true, receivedAt: action.receivedAt });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = {
          'type': 'FeatureCollection',
          'features': generateGeoJSON(action.data)
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
