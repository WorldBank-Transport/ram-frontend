'use strict';
import 'babel-polyfill';

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, Redirect, hashHistory, applyRouterMiddleware } from 'react-router';
import { useScroll } from 'react-router-scroll';
import { syncHistoryWithStore } from 'react-router-redux';

import config from './config';
import store from './utils/store';
import { isValidLanguage, setLanguage } from './utils/i18n';
import Auth from './utils/auth-service';
import { loginSuccess } from './actions';
import { storePrevPath, popPrevPath } from './utils/utils';

// Views.
import App from './views/app';
import Home from './views/home';
import UhOh from './views/uhoh';
import ProjectPageActive from './views/project-page-active';
import ProjectPagePending from './views/project-page-pending';
import ScenarioPage from './views/scenario-page';
import Playground from './views/playground';

const history = syncHistoryWithStore(hashHistory, store);

const auth = new Auth(store);

const scrollerMiddleware = useScroll((prevRouterProps, currRouterProps) => {
  // When a hash is set do not scroll to the top.
  if (currRouterProps.location.hash) return false;

  return prevRouterProps &&
    decodeURIComponent(currRouterProps.location.pathname) !== decodeURIComponent(prevRouterProps.location.pathname);
});

function validateLanguage (nextState, replace) {
  if (isValidLanguage(nextState.params.lang)) {
    setLanguage(nextState.params.lang);
  } else {
    replace('/en/404');
  }
}

function playgroundAccess (nextState, replace) {
  if (config.environment !== 'development') {
    replace('/en/404');
  }
}

if (config.auth && config.auth.clientID && auth.isAuthenticated()) {
  store.dispatch(loginSuccess());
}

function parseAuthHash (nextState, replace) {
  let hash = nextState.location.pathname.slice(1);
  auth.parseHash(hash, function (err) {
    if (err) {
      // Handle auth error
      console.log('err', err);
    } else {
      store.dispatch(loginSuccess());
      replace(popPrevPath());
    }
  });
}

function login (nextState) {
  storePrevPath(nextState.location);
  auth.login();
}

function logout (nextState, replace) {
  storePrevPath(nextState.location);
  auth.logout();
  replace(popPrevPath());
}

render((
  <Provider store={store}>
    <Router history={history} render={applyRouterMiddleware(scrollerMiddleware)}>
      <Route path="/access_token=:access_token" onEnter={parseAuthHash} />
      <Route path="/login" onEnter={login} />
      <Route path="/logout" onEnter={logout} />
      <Route path='/:lang' component={App} onEnter={validateLanguage}>
        <Route path="404" component={UhOh}/>
        <Route path="projects/:projectId/setup" component={ProjectPagePending}/>
        <Route path="projects/:projectId" component={ProjectPageActive}/>
        <Route path="projects/:projectId/scenarios/:scenarioId" component={ScenarioPage}/>
        <Route path="playground" component={Playground} onEnter={playgroundAccess} />
        <IndexRoute component={Home} pageClass='page--homepage' />
        <Redirect from='/:lang/projects/:projectId/scenarios' to='/:lang/projects/:projectId' />
        <Redirect from='/:lang/projects' to='/:lang' />
        <Route path="*" component={UhOh}/>
      </Route>

      <Redirect from='/' to='/en' />
    </Router>
  </Provider>
), document.querySelector('#app-container'));
