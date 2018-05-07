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

module.exports = config;
