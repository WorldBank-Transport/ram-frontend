'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import ReactTooltip from 'react-tooltip';

import Dropdown from '../dropdown';
import { showConfirm } from '../confirmation-prompt';
import { t } from '../../utils/i18n';

window.ReactTooltip = ReactTooltip;

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

  onGenerateClick: function (isActive, e) {
    isActive && this.props.onAction('generate', e);
  },

  onEditClick: function (isActive, e) {
    isActive && this.props.onAction('edit-network', e);
  },

  render: function () {
    let isGenerating = this.props.scenario.gen_analysis && this.props.scenario.gen_analysis.status === 'running';

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
        <button data-tip data-for='tip-generate' title={t('Edit network')} className={c('ipa-pencil', {'visually-disabled': isGenerating})} type='button' onClick={this.onEditClick.bind(null, !isGenerating)}><span>{t('Edit')}</span></button>
        <button data-tip data-for='tip-soon' title={t('Download results')} className='ipa-download visually-disabled' type='button' onClick={this.props.onAction.bind(null, 'download-results')}><span>{t('Download')}</span></button>

        <button data-tip data-for='tip-generate' title={t('Generate results')} className={c('ipa-arrow-loop', {'visually-disabled': isGenerating})} type='button' onClick={this.onGenerateClick.bind(null, !isGenerating)}><span>{t('Generate')}</span></button>

        <ReactTooltip id='tip-generate' effect='solid' disable={!isGenerating}>
          {t('Generation is in progress.')}
        </ReactTooltip>

        <ReactTooltip id='tip-soon' effect='solid'>
          {t('Coming soon...')}
        </ReactTooltip>
      </div>
    );
  }
});

export default ScenarioHeaderActions;
