'use strict';
/*
 * App config for production.
 */
module.exports = {
  api: null,
  iDEditor: 'http://id.ruralaccess.info',
  mbtoken: null,
  rahUrl: null,
  auth: {},
  // Set value to 0 to disable rn editing. Must also be disabled in backend.
  // Value in bytes.
  roadNetEditMax: 20 * Math.pow(1024, 2)
};
