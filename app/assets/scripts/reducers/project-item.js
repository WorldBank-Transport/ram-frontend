import { REQUEST_PROJECT_ITEM, RECEIVE_PROJECT_ITEM, INVALIDATE_PROJECT_ITEM } from '../actions';

const initialState = {
  fetching: false,
  fetched: false,
  data: {
    meta: {
      page: null,
      limit: null,
      found: null
    },
    results: []
  }
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_PROJECT_ITEM:
      return Object.assign({}, state, initialState);
    case REQUEST_PROJECT_ITEM:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_PROJECT_ITEM:
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
