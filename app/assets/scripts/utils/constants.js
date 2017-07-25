'use strict';
import { t } from '../utils/i18n';

let rnEditThresholdVal = 100; // MB
export const rnEditThreshold = rnEditThresholdVal * Math.pow(1024, 2); // bytes
export const rnEditThresholdDisplay = `${rnEditThresholdVal}MB`;

export const fileTypesMatrix = {
  'admin-bounds': {
    display: t('Administrative Boundaries'),
    description: t('Boundaries for the administrative areas for which analysis is generated.'),
    helpPath: '/help#administrative-boundaries'
  },
  origins: {
    display: t('Population data'),
    description: t('Population point data that will be used as origins.'),
    helpPath: '/help#population-data'
  },
  poi: {
    display: t('Points of Interest'),
    description: t('The POI used as destinations. Each scenario supports multiple types.'),
    helpPath: '/help#points-of-interest'
  },
  'road-network': {
    display: t('Road Network'),
    description: t('The road network data used for routing.'),
    helpPath: '/help#road-network'
  },
  profile: {
    display: t('Profile'),
    description: t('A lua file with the OSRM Profile.'),
    helpPath: '/help#profile'
  }
};

export const projectStatusMatrix = {
  active: t('Active'),
  pending: t('Draft')
};

export const poiOsmTypes = [
  {
    key: 'health',
    value: t('Health facilities')
  },
  {
    key: 'education',
    value: t('Education facilities')
  },
  {
    key: 'financial',
    value: t('Financial institutions')
  }
];
