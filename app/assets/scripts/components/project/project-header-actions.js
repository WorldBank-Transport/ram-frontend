'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import Dropdown from '../dropdown';
import { showConfirm } from '../confirmation-prompt';
import { t } from '../../utils/i18n';

const ProjectHeaderActions = React.createClass({

  propTypes: {
    onAction: T.func,
    projectStatus: T.string,
    project: T.object
  },

  onDelete: function (e) {
    e.preventDefault();

    showConfirm({
      title: t('Delete project'),
      body: (
        <div>
          <p>{t('Are you sure you want to delete {name}?', {name: <strong>{this.props.project.name}</strong>})}</p>
          <p>{t('All project related files and scenarios will be deleted as well.')}</p>
        </div>
      )
    }, () => {
      this.props.onAction('delete', e);
    });
  },

  renderFinishSetupButton: function () {
    var readyToEndSetup = this.props.project.readyToEndSetup;
    var isFinishingSetup = false;

    let finishSetupLog = this.props.project.finish_setup;
    if (finishSetupLog) {
      isFinishingSetup = finishSetupLog.status === 'running';
      let l = finishSetupLog.logs.length;
      if (l === 0 || finishSetupLog.logs[l - 1].code !== 'error') {
        isFinishingSetup = true;
      }
    }

    const disabled = !readyToEndSetup || isFinishingSetup;

    return (
      <button title={t('Finish setup')} className={c('ipa-tick ipa-main', {disabled})} type='button' onClick={this.props.onAction.bind(null, 'finish')} disabled={disabled}><span>{t('Finish setup')}</span></button>
    );
  },

  renderRahExportButton: function () {
    if (this.props.projectStatus !== 'active') return null;

    return (
      <button
        type='button'
        title={t('Export to Accessibility Hub')}
        className='ipa-export'
        onClick={this.props.onAction.bind(null, 'export-rah')}>
        <span>{t('Export')}</span>
      </button>
    );
  },

  render: function () {
    return (
      <div className='inpage__actions'>
        <Dropdown
          triggerClassName='ipa-ellipsis'
          triggerActiveClassName='button--active'
          triggerText='Options'
          triggerTitle={t('Project options')}
          direction='down'
          alignment='center' >
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Edit metadata')} className='drop__menu-item dmi-pencil' data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'edit')}>{t('Edit metadata')}</a></li>
            </ul>
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Delete project')} className='drop__menu-item drop__menu-item--danger dmi-trash' data-hook='dropdown:close' onClick={this.onDelete}>{t('Delete project')}</a></li>
            </ul>
        </Dropdown>

        {this.renderRahExportButton()}

        {this.props.projectStatus === 'active'
          ? <button title={t('Create new scenario')} className='ipa-plus ipa-main' type='button' onClick={this.props.onAction.bind(null, 'new-scenario')}><span>{t('New scenario')}</span></button>
          : this.renderFinishSetupButton()
        }

      </div>
    );
  }
});

export default ProjectHeaderActions;
