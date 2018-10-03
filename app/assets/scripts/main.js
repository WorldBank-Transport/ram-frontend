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

// Auth0 uses the callback with a hash value but since we're using hash history
// this causes a problem, therefore correct the url before loading the page.
// from host.com/#access_token => host.com/#/access_token
if (window.location.hash.match('#(access_token|error)')) {
  window.location.replace(`${window.location.protocol}//${window.location.host}/#/${window.location.hash.substr(1)}`);
  window.location.reload();
} else {
  const history = syncHistoryWithStore(hashHistory, store);
  const auth = new Auth(store);

  const scrollerMiddleware = useScroll((prevRouterProps, currRouterProps) => {
    // When a hash is set do not scroll to the top.
    if (currRouterProps.location.hash) return false;

    return prevRouterProps &&
      decodeURIComponent(currRouterProps.location.pathname) !== decodeURIComponent(prevRouterProps.location.pathname);
  });

  const validateLanguage = (nextState, replace) => {
    if (isValidLanguage(nextState.params.lang)) {
      setLanguage(nextState.params.lang);
    } else {
      replace('/en/404');
    }
  };

  const playgroundAccess = (nextState, replace) => {
    if (config.environment !== 'development') {
      replace('/en/404');
    }
  };

  const parseAuthHash = (nextState, replace, cb) => {
    let hash = nextState.location.pathname.slice(1);
    auth.parseHash(hash, err => {
      if (err) {
        // Handle auth error
        console.log('err', err);
        replace(`/?error=${err.errorDescription}`);
      } else {
        store.dispatch(loginSuccess());
        replace(popPrevPath());
      }
      cb();
    });
  };

  const login = (nextState) => {
    storePrevPath(nextState.location);
    auth.login();
  };

  const logout = (nextState, replace) => {
    storePrevPath(nextState.location);
    auth.logout();
    replace(popPrevPath());
  };

  if (config.auth && config.auth.clientID && auth.isAuthenticated()) {
    store.dispatch(loginSuccess());
  }

  render((
    <Provider store={store}>
      <Router history={history} render={applyRouterMiddleware(scrollerMiddleware)}>
        <Route path="/access_token=:access_token" onEnter={parseAuthHash} />
        <Route path="/error=:error" onEnter={parseAuthHash} />
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
}
