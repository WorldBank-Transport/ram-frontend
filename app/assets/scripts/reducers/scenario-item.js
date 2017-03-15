import {
  REQUEST_SCENARIO_ITEM,
  RECEIVE_SCENARIO_ITEM,
  INVALIDATE_SCENARIO_ITEM,
  REMOVE_SCENARIO_ITEM_FILE,
  FINISH_SUBMIT_SCENARIO
} from '../actions';
import _ from 'lodash';

const initialState = {
  fetching: false,
  fetched: false,
  receivedAt: null,
  data: {
  }
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case INVALIDATE_SCENARIO_ITEM:
      return Object.assign({}, state, initialState);
    case REQUEST_SCENARIO_ITEM:
      return Object.assign({}, state, { error: null, fetching: true, fetched: false });
    case RECEIVE_SCENARIO_ITEM:
      state = Object.assign({}, state, { fetching: false, fetched: true, receivedAt: action.receivedAt });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data;
      }
      break;
    case REMOVE_SCENARIO_ITEM_FILE:
      state = _.cloneDeep(state);
      state.data.files = state.data.files.filter(o => o.id !== action.fileId);
      return state;
    case FINISH_SUBMIT_SCENARIO:
      state = Object.assign({}, state);
      if (!action.error) {
        state.data = Object.assign({}, state.data, action.data);
      }
      break;
  }
  return state;
}
