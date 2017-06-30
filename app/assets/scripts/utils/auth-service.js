import auth0 from 'auth0-js';
import config from '../config.js';
import { logoutSuccess } from '../actions';

export default class Auth {
  constructor (store) {
    if (config.auth) {
      let {domain, clientID, redirectUri, audience} = config.auth;

      this.auth0 = new auth0.WebAuth({
        domain,
        clientID,
        redirectUri,
        audience,
        responseType: 'token id_token',
        scope: 'openid'
      });
    }

    this.store = store;
  }

  parseHash (hash, callback) {
    this.auth0.parseHash(hash, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        callback(null);
      } else if (err) {
        callback(err);
      }
    });
  }

  setSession (authResult) {
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  login () {
    this.auth0.authorize();
  }

  logout () {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    this.store.dispatch(logoutSuccess());
  }

  getAccessToken () {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('no access token found');
    }
    return accessToken;
  }

  isAuthenticated () {
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }
}
