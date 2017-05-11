import { REQUEST_SCENARIO_RESULTS, RECEIVE_SCENARIO_RESULTS, INVALIDATE_SCENARIO_RESULTS } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_SCENARIO_RESULTS:
      return Object.assign({}, state, initialState);
    case REQUEST_SCENARIO_RESULTS:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_RESULTS:
      state = Object.assign({}, state, { fetching: false, fetched: true });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data;
      }
      break;
  }
  return state;
}
