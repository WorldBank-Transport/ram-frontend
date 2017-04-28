'use strict';

const boundsToMapLocation = (inputCoords) => {
  const WORLD_DIM = { height: 256, width: 256 };
  var ZOOM_MAX = 21;

  // height is 32rem in RRA css
  const mapHeight = 32 * Number(window.getComputedStyle(document.body)
                         .getPropertyValue('font-size').replace(/px/, ''));
  // width is container width minus lesser of 33.33% and 400px in iD css
  const containerWidth = document.querySelector('#app-container').offsetWidth;
  const mapSidebarWidth = containerWidth * 0.33 < 400 ? Math.round(containerWidth * 0.33) : 400;

  const mapDimensions = {
    width: containerWidth - mapSidebarWidth,
    height: mapHeight
  };

  const bounds = {
    southwest: {
      lng: inputCoords[0],
      lat: inputCoords[1]},
    northeast: {
      lng: inputCoords[2],
      lat: inputCoords[3]}
  };

  const latRad = (lat) => {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };

  const getZoom = (mapPx, worldPx, fraction) => {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  };

  const ne = bounds.northeast;
  const sw = bounds.southwest;

  const latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

  const lngDiff = ne.lng - sw.lng;
  const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

  const latZoom = getZoom(mapDimensions.height, WORLD_DIM.height, latFraction);
  const lngZoom = getZoom(mapDimensions.width, WORLD_DIM.width, lngFraction);

  const zoom = Math.min(latZoom, lngZoom, ZOOM_MAX);

  const center = {
    lng: ((bounds.southwest.lng + bounds.northeast.lng) / 2).toFixed(4),
    lat: ((bounds.southwest.lat + bounds.northeast.lat) / 2).toFixed(4)
  };

  return {zoom: zoom, center: center};
};

export default boundsToMapLocation;
