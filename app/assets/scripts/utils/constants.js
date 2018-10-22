'use strict';
import { t } from '../utils/i18n';
import { roadNetEditMax as rnConfMax } from '../config';

export const roadNetEditMax = rnConfMax;
export const roadNetEditMaxDisplay = `${rnConfMax / Math.pow(1024, 2)}MB`;

// These constants need to be returned as the result of a function because, the
// translations need to be computed based on the current language. Otherwise
// they'd always be returned in English.
export const getfFileTypesMatrix = () => ({
  'admin-bounds': {
    display: t('Administrative Boundaries'),
    description: t('Boundaries for the administrative areas for which analysis is generated.'),
    helpPath: 'http://ruralaccess.info/setting-up-a-project/admin-boundaries/'
  },
  origins: {
    display: t('Population data'),
    description: t('Population point data that will be used as origins.'),
    helpPath: 'http://ruralaccess.info/setting-up-a-project/population/'
  },
  poi: {
    display: t('Points of Interest'),
    description: t('The POI used as destinations. Each scenario supports multiple types.'),
    helpPath: 'http://ruralaccess.info/setting-up-a-project/poi/'
  },
  'road-network': {
    display: t('Road Network'),
    description: t('The road network data used for routing.'),
    helpPath: 'http://ruralaccess.info/setting-up-a-project/road-network/'
  },
  profile: {
    display: t('Profile'),
    description: t('A lua file with the OSRM Profile.'),
    helpPath: 'http://ruralaccess.info/setting-up-a-project/osrm-profile/'
  }
});

export const getProjectStatusMatrix = () => ({
  active: t('Active'),
  pending: t('Draft')
});

export const getPoiOsmTypes = () => ([
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
]);
