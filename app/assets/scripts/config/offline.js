'use strict';
/*
 * App config overrides for offline.
 */
module.exports = {
  environment: 'offline',
  api: 'http://localhost:4000',
  iDEditor: 'http://localhost:8000',
  mbtoken: 'pk.eyJ1IjoicnVyYWxyb2FkcyIsImEiOiJjajlmbTBzN3IyaWVyMndwYTJ3dzFnYjhwIn0.1z7NRCrUVWStt5YURX_HGg',
  rahUrl: 'http://rah.surge.sh',
  // Set value to 0 to disable rn editing. Must also be disabled in backend.
  // Value in bytes.
  roadNetEditMax: 20 * Math.pow(1024, 2)
};
