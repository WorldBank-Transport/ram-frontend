'use strict';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, hashHistory, applyRouterMiddleware } from 'react-router';
import { useScroll } from 'react-router-scroll';
import { syncHistoryWithStore } from 'react-router-redux';

import config from './config';
import store from './utils/store';

// Views.
import App from './views/app';
import Home from './views/home';
import UhOh from './views/uhoh';

const history = syncHistoryWithStore(hashHistory, store);

const scrollerMiddleware = useScroll((prevRouterProps, currRouterProps) => {
  return prevRouterProps &&
    decodeURIComponent(currRouterProps.location.pathname) !== decodeURIComponent(prevRouterProps.location.pathname);
});

render((
  <Provider store={store}>
    <Router history={history} render={applyRouterMiddleware(scrollerMiddleware)}>
      <Route path='/' component={App}>
        <IndexRoute component={Home} pageClass='page--homepage' />
        <Route path="*" component={UhOh}/>
      </Route>
    </Router>
  </Provider>
), document.querySelector('#app-container'));
