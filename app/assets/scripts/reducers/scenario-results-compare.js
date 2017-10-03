import { INVALIDATE_SCENARIO_COMPARE, REQUEST_SCENARIO_COMPARE, RECEIVE_SCENARIO_COMPARE } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_SCENARIO_COMPARE:
      return Object.assign({}, state, initialState);
    case REQUEST_SCENARIO_COMPARE:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_COMPARE:
      state = Object.assign({}, state, { fetching: false, fetched: true, receivedAt: action.receivedAt });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = {
          geo: {
            'type': 'FeatureCollection',
            'features': generateGeoJSON(action.data.geo)
          },
          analysis: action.data.analysis
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
