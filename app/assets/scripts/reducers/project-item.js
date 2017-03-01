import { REQUEST_PROJECT_ITEM, RECEIVE_PROJECT_ITEM, INVALIDATE_PROJECT_ITEM, REMOVE_PROJECT_ITEM_FILE } from '../actions';
import _ from 'lodash';

const initialState = {
  fetching: false,
  fetched: false,
  data: {
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
    case REMOVE_PROJECT_ITEM_FILE:
      state = _.cloneDeep(state);
      state.data.files = state.data.files.filter(o => o.id !== action.fileId);
      return state;
  }
  return state;
}
