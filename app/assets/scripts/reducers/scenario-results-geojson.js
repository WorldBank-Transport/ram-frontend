import { REQUEST_SCENARIO_RESULTS_GEOJSON, RECEIVE_SCENARIO_RESULTS_GEOJSON } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case REQUEST_SCENARIO_RESULTS_GEOJSON:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_RESULTS_GEOJSON:
      state = Object.assign({}, state, { fetching: false, fetched: true, receivedAt: action.receivedAt });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data;
      }
      break;
  }
  return state;
}
