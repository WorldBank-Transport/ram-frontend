'use strict';
import { t } from '../utils/i18n';

export const fileTypesMatrix = {
  profile: {
    display: t('Profile'),
    description: t('The profile is used to convert osm to osrm')
  },
  'admin-bounds': {
    display: t('Administrative Boundaries'),
    description: t('GeoJSON file containing the administrative boundaries')
  },
  villages: {
    display: t('Village and population data'),
    description: t('Villages GeoJSON with population data')
  },
  poi: {
    display: t('Points of interest'),
    description: t('GeoJSON for the points of interest (banks, hospitals...)')
  },
  'road-network': {
    display: t('Road Network'),
    description: t('Road network to use')
  }
};