import {
  RESET_SCENARIO_FORM,
  START_SUBMIT_SCENARIO,
  FINISH_SUBMIT_SCENARIO,
  START_DELETE_SCENARIO,
  FINISH_DELETE_SCENARIO
} from '../actions';

const initialState = {
  processing: false,
  action: null,
  error: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case RESET_SCENARIO_FORM:
      return Object.assign({}, state, initialState);
    case START_SUBMIT_SCENARIO:
      return Object.assign({}, state, initialState, {processing: true, action: 'edit'});
    case FINISH_SUBMIT_SCENARIO:
      state = Object.assign({}, state, { processing: false });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data.results || action.data;
      }
      break;
    case START_DELETE_SCENARIO:
      return Object.assign({}, state, initialState, {processing: true, action: 'delete'});
    case FINISH_DELETE_SCENARIO:
      state = Object.assign({}, state, { processing: false });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data.results || action.data;
      }
      break;
  }
  return state;
}
