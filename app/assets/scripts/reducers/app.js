import { SHOW_GLOBAL_LOADING, HIDE_GLOBAL_LOADING } from '../actions';

const initialState = {
  globalLoading: false,
  globalLoadingTime: null
};

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case SHOW_GLOBAL_LOADING:
      return Object.assign({}, state, { globalLoading: true, globalLoadingTime: action.time });
    case HIDE_GLOBAL_LOADING:
      return Object.assign({}, state, { globalLoading: false, globalLoadingTime: null });
  }
  return state;
}
