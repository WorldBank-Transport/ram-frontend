import {
  RESET_PROFILE_SETTINGS_FORM,
  START_SUBMIT_PROFILE_SETTINGS,
  FINISH_SUBMIT_PROFILE_SETTINGS
} from '../actions';

const initialState = {
  processing: false,
  error: null,
  data: {}
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case RESET_PROFILE_SETTINGS_FORM:
      return Object.assign({}, state, initialState);
    case START_SUBMIT_PROFILE_SETTINGS:
      return Object.assign({}, state, initialState, {processing: true});
    case FINISH_SUBMIT_PROFILE_SETTINGS:
      state = Object.assign({}, state, { processing: false });
      if (action.error) {
        state.error = action.error;
      } else {
        state.data = action.data;
      }
      break;
  }
  return state;
}
