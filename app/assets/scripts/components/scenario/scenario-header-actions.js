'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import ReactTooltip from 'react-tooltip';

import config from '../../config';
import Dropdown from '../dropdown';
import { t } from '../../utils/i18n';
import { scenarioHasResults } from '../../utils/utils';
import { showConfirm } from '../confirmation-prompt';

import ScenarioDeleteAction from './scenario-delete-action';

const tipTexts = {
  rnNotAllowed: t('Road network is too big and can\'t be edited.'),
  generating: t('Generation is in progress.'),
  pending: t('Scenario still being created.')
};

const ScenarioHeaderActions = React.createClass({

  propTypes: {
    onAction: T.func,
    scenario: T.object
  },

  onGenerateClick: function (e) {
    this.props.onAction('generate', e);
  },

  onAbortClick: function (e) {
    showConfirm({
      title: t('Abort analysis'),
      body: (
        <div>
          <p>{t('Are you sure you want to abort the analysis?')}</p>
        </div>
      )
    }, () => {
      this.props.onAction('abort', e);
    });
  },

  onEditClick: function (isActive, e) {
    isActive && this.props.onAction('edit-network', e);
  },

  renderRNButton: function (isGenerating, isPending, isRnAllowed) {
    let disable = !isGenerating && !isPending && isRnAllowed;
    let txt;

    if (!isRnAllowed) {
      txt = tipTexts.rnNotAllowed;
    } else if (isGenerating) {
      txt = tipTexts.generating;
    } else if (isPending) {
      txt = tipTexts.pending;
    }

    return (
      <button
        data-tip={txt}
        data-tip-disable={disable}
        data-effect='solid'
        title={t('Edit network')}
        className={c('ipa-pencil', {'visually-disabled': isGenerating || isPending || !isRnAllowed})}
        type='button'
        onClick={this.onEditClick.bind(null, !isGenerating)}>
          <span>{t('Network')}</span>
      </button>
    );

    /* <button data-tip={t('Coming soon')} data-effect='solid' title={t('Edit network')} className='ipa-pencil visually-disabled' type='button' ><span>{t('Network')}</span></button> */
  },

  renderGenerateAbort: function (isGenerating, isPending) {
    let disable = !isPending;
    let txt;

    if (isPending) {
      txt = tipTexts.pending;
    }

    return isGenerating ? (
      <button
        data-tip-disable={true}
        title={t('Abort analysis')}
        className='ipa-cancel'
        type='button'
        onClick={this.onAbortClick}>
        <span>{t('Analysis')}</span>
      </button>
    ) : (
      <button
        data-tip={txt}
        data-tip-disable={disable}
        data-effect='solid'
        title={t('Generate analysis')}
        className={c('ipa-arrow-loop ipa-main', {'visually-disabled': isPending})}
        type='button'
        onClick={this.onGenerateClick}>
        <span>{t('Analysis')}</span>
      </button>
    );
  },

  render: function () {
    let isGenerating = this.props.scenario.gen_analysis && this.props.scenario.gen_analysis.status === 'running';
    let isMaster = this.props.scenario.master;
    let isPending = this.props.scenario.status === 'pending';
    let isRnAllowed = !!this.props.scenario.data.rn_active_editing;

    let hasResults = scenarioHasResults(this.props.scenario);
    let resultsUrl = `${config.api}/projects/${this.props.scenario.project_id}/scenarios/${this.props.scenario.id}/results?download=true`;

    return (
      <div className='inpage__actions'>
        <Dropdown
          onChange={(open) => open ? ReactTooltip.rebuild() : ReactTooltip.hide()}
          className='scenario-meta-menu'
          triggerClassName='ipa-ellipsis'
          triggerActiveClassName='button--active'
          triggerText={t('Options')}
          triggerTitle={t('Scenario options')}
          direction='down'
          alignment='center' >
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Edit metadata')} className={c('drop__menu-item dmi-pencil', {'visually-disabled': isPending})} data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'edit-metadata')}>{t('Edit metadata')}</a></li>
              <li><a href='#' title={t('Duplicate scenario')} className={c('drop__menu-item dmi-copy', {'visually-disabled': isPending})} data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'duplicate')}>{t('Duplicate scenario')}</a></li>
            </ul>
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><ScenarioDeleteAction isMaster={isMaster} name={this.props.scenario.name} onDeleteConfirm={this.props.onAction.bind(null, 'delete')}/></li>
            </ul>
        </Dropdown>

        {this.renderRNButton(isGenerating, isPending, isRnAllowed)}

        {isPending ? (
          <button data-tip={t('Scenario still being created')} data-effect='solid' title={t('Download data')} className='ipa-download visually-disabled' type='button' ><span>{t('Data')}</span></button>
        ) : (
        <Dropdown
          onChange={(open) => open ? ReactTooltip.rebuild() : ReactTooltip.hide()}
          className={c({'visually-disabled': !hasResults})}
          triggerClassName='ipa-download'
          triggerActiveClassName='button--active'
          triggerText={t('Data')}
          triggerTitle={t('Download data')}
          direction='down'
          alignment='center' >
            <ul className='drop__menu' role='menu'>
              <li><a href={`${resultsUrl}&type=csv`} data-tip data-for='tip-no-results' title={t('Download data in CSV format')} className='drop__menu-item csv' onClick={(e) => !hasResults && e.preventDefault()}><span>{t('CSV format')}</span></a></li>
              <li><a href={`${resultsUrl}&type=geojson`} data-tip data-for='tip-no-results' title={t('Download data in GeoJSON format')} className='drop__menu-item geojson' onClick={(e) => !hasResults && e.preventDefault()}><span>{t('GeoJSON format')}</span></a></li>
            </ul>
        </Dropdown>
        )}

        <ReactTooltip />

        <ReactTooltip id='tip-no-results' effect='solid' disable={hasResults}>
          {t('No results were generated yet')}
        </ReactTooltip>

        {this.renderGenerateAbort(isGenerating, isPending)}

      </div>
    );
  }
});

export default ScenarioHeaderActions;
