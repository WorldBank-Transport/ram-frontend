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

module.exports = config;
