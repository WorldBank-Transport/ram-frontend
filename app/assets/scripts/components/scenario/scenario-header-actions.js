'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import Dropdown from '../dropdown';
import { t } from '../../utils/i18n';

const ScenarioHeaderActions = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <div className='inpage__actions'>
        <Dropdown
          className='scenario-meta-menu'
          triggerClassName='ipa-ellipsis'
          triggerActiveClassName='button--active'
          triggerText='Action'
          triggerTitle='Action'
          direction='down'
          alignment='center' >
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Edit metadata')} className='drop__menu-item dmi-pencil' data-hook='dropdown:close'>{t('Edit metadata')}</a></li>
              <li><a href='#' title={t('Duplicate scenario')} className='drop__menu-item dmi-copy' data-hook='dropdown:close'>{t('Duplicate scenario')}</a></li>
            </ul>
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Delete scenario')} className='drop__menu-item drop__menu-item--danger dmi-trash' data-hook='dropdown:close'>{t('Delete scenario')}</a></li>
            </ul>
        </Dropdown>
        <button title={t('Edit network')} className='ipa-pencil' type='button'><span>{t('Edit')}</span></button>
        <button title={t('Download results')} className='ipa-download' type='button'><span>{t('Download')}</span></button>
        <div className='button-group button-group--horizontal'>
          <button title={t('Generate results')} className='ipa-arrow-loop' type='button'><span>{t('Generate')}</span></button>
          <button title={t('Settings')} className='ipa-cog' type='button'><span>{t('Settings')}</span></button>
        </div>
      </div>
    );
  }
});

export default ScenarioHeaderActions;
