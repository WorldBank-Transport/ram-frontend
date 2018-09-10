import { REQUEST_PROFILE_SETTINGS, RECEIVE_PROFILE_SETTINGS, INVALIDATE_PROFILE_SETTINGS } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  data: null
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_PROFILE_SETTINGS:
      return Object.assign({}, state, initialState);
    case REQUEST_PROFILE_SETTINGS:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_PROFILE_SETTINGS:
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
