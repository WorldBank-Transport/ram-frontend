'use strict';
import { t } from '../utils/i18n';

export const fileTypesMatrix = {
  'admin-bounds': {
    display: t('Administrative Boundaries'),
    description: t('A GeoJSON containing polygons with the administrative boundaries.')
  },
  villages: {
    display: t('Population data'),
    description: t('A GeoJSON with population point data. This will be used as the Origin in the analysis.')
  },
  poi: {
    display: t('Points of Interest'),
    description: t('GeoJSON for the Points of Interest (eg. banks or hospitals). These are the destinations in the analysis.')
  },
  'road-network': {
    display: t('Road Network'),
    description: t('The underlying road network in OSM XML format.')
  },
  profile: {
    display: t('Profile'),
    description: t('A lua file with the OSRM Profile.')
  }
};
