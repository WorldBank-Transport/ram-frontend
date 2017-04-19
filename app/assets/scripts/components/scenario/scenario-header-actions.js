'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import ReactTooltip from 'react-tooltip';

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

    if (this.props.scenario.master) {
      return;
    }

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

  render: function () {
    let isGenerating = this.props.scenario.gen_analysis && this.props.scenario.gen_analysis.status === 'running';
    let isMaster = this.props.scenario.master;

    return (
      <div className='inpage__actions'>
        <Dropdown
          onChange={(open) => open ? ReactTooltip.rebuild() : ReactTooltip.hide()}
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
            {isMaster ? (
              <li><a href='#' data-tip data-for='tip-no-delete' title={t('Delete scenario')} className={'drop__menu-item drop__menu-item--danger dmi-trash visually-disabled'} onClick={this.onDelete}>{t('Delete scenario')}</a></li>
            ) : (
              <li><a href='#' title={t('Delete scenario')} className={'drop__menu-item drop__menu-item--danger dmi-trash'} data-hook='dropdown:close' onClick={this.onDelete}>{t('Delete scenario')}</a></li>
            )}
            </ul>
        </Dropdown>
        { /* <button title={t('Edit network')} className='ipa-pencil' type='button' onClick={this.props.onAction.bind(null, 'edit-network')}><span>{t('Edit')}</span></button> */ }
        <button data-tip data-for='tip-soon' title={t('Edit network')} className='ipa-pencil visually-disabled' type='button'><span>{t('Edit')}</span></button>
        <button data-tip data-for='tip-soon' title={t('Download results')} className='ipa-download visually-disabled' type='button' onClick={this.props.onAction.bind(null, 'download-results')}><span>{t('Download')}</span></button>

        <button data-tip data-for='tip-generate' title={t('Generate results')} className={c('ipa-arrow-loop', {'visually-disabled': isGenerating})} type='button' onClick={this.onGenerateClick.bind(null, !isGenerating)}><span>{t('Generate')}</span></button>

        <ReactTooltip id='tip-generate' effect='solid' disable={!isGenerating}>
          {t('Generation already in progress.')}
        </ReactTooltip>

        <ReactTooltip id='tip-soon' effect='solid'>
          {t('Coming soon...')}
        </ReactTooltip>

        <ReactTooltip id='tip-no-delete' effect='solid'>
          {t('The project\'s master scenario can\'t be deleted')}
        </ReactTooltip>

      </div>
    );
  }
});

export default ScenarioHeaderActions;
