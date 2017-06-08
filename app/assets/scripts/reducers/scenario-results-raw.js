import { REQUEST_SCENARIO_RESULTS_RAW, RECEIVE_SCENARIO_RESULTS_RAW, INVALIDATE_SCENARIO_RESULTS_RAW } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_SCENARIO_RESULTS_RAW:
      return Object.assign({}, state, initialState);
    case REQUEST_SCENARIO_RESULTS_RAW:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_RESULTS_RAW:
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
