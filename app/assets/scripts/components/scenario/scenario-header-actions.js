'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import Dropdown from '../dropdown';
import { showConfirm } from '../confirmation-prompt';
import { t } from '../../utils/i18n';

const ScenarioHeaderActions = React.createClass({

  propTypes: {
    onAction: T.func,
    scenario: T.object
  },

  onDelete: function (e) {
    e.preventDefault();

    showConfirm({
      title: t('Delete scenario'),
      body: (
        <div>
          <p>{t('Are you sure you want to delete {name}?', {name: <strong>{this.props.scenario.name}</strong>})}</p>
        </div>
      )
    }, () => {
      this.props.onAction('delete', e);
    });
  },

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
              <li><a href='#' title={t('Edit metadata')} className='drop__menu-item dmi-pencil' data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'edit-metadata')}>{t('Edit metadata')}</a></li>
              <li><a href='#' title={t('Duplicate scenario')} className='drop__menu-item dmi-copy' data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'duplicate')}>{t('Duplicate scenario')}</a></li>
            </ul>
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Delete scenario')} className={c('drop__menu-item drop__menu-item--danger dmi-trash', {disabled: this.props.scenario.master})} data-hook='dropdown:close' onClick={this.onDelete}>{t('Delete scenario')}</a></li>
            </ul>
        </Dropdown>
        <button title={t('Edit network')} className='ipa-pencil' type='button' onClick={this.props.onAction.bind(null, 'edit-network')}><span>{t('Edit')}</span></button>
        <button title={t('Download results')} className='ipa-download' type='button' onClick={this.props.onAction.bind(null, 'download-results')}><span>{t('Download')}</span></button>
        <div className='button-group button-group--horizontal'>
          <button title={t('Generate results')} className='ipa-arrow-loop' type='button' onClick={this.props.onAction.bind(null, 'generate')}><span>{t('Generate')}</span></button>
          <button title={t('Settings')} className='ipa-cog' type='button' onClick={this.props.onAction.bind(null, 'generate-settings')}><span>{t('Settings')}</span></button>
        </div>
      </div>
    );
  }
});

export default ScenarioHeaderActions;
