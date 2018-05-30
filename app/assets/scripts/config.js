'use strict';
const _ = require('lodash');

// Empty template as base.
var config = require('./config/base');

// local config overrides when present.
try {
  _.merge(config, require('./config/local'));
} catch (e) {
  // Local file is not mandatory.
}

// In an offline setup, the other config files are ignored
if (process.env.DS_ENV === 'offline') {
  config = require('./config/offline');
}

config.api = process.env.API || config.api;
config.iDEditor = process.env.IDEDITOR || config.iDEditor;
config.mbtoken = process.env.MBTOKEN || config.mbtoken;

// auth is an empty object, unless one of the environment vars is set
if (process.env.AUTH_DOMAIN) config.auth.domain = process.env.AUTH_DOMAIN;
if (process.env.AUTH_CLIENTID) config.auth.clientID = process.env.AUTH_CLIENTID;
if (process.env.AUTH_REDIRECTURI) config.auth.redirectUri = process.env.AUTH_REDIRECTURI;
if (process.env.AUTH_AUDIENCE) config.auth.audience = process.env.AUTH_AUDIENCE;

module.exports = config;
