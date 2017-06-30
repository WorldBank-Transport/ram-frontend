import {
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS
} from '../actions';

const initialState = {
  isAuthenticated: false
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return Object.assign({}, state, {isAuthenticated: true});
    case LOGOUT_SUCCESS:
      return Object.assign({}, state, initialState);
  }
  return state;
}
