'use strict';
import React, { PropTypes as T } from 'react';

import Dropdown from '../dropdown';
import { showConfirm } from '../confirmation-prompt';
import { t } from '../../utils/i18n';

const PorjectHeaderActions = React.createClass({

  propTypes: {
    onAction: T.func,
    project: T.object
  },

  onDelete: function (e) {
    e.preventDefault();

    showConfirm({
      title: t('Delete project'),
      // TODO: https://github.com/WorldBank-Transport/rra-frontend/issues/46
      body: (
        <div>
          <p>Are you sure you want to delete <strong>{this.props.project.name}</strong>?</p>
          <p>All project related files and scenarios will be deleted as well.</p>
        </div>
      )
    }, () => {
      this.props.onAction('delete', e);
    });
  },

  render: function () {
    var projectWasSetup = this.props.project.status !== 'pending';

    return (
      <div className='inpage__actions'>
        <Dropdown
          triggerClassName='ipa-ellipsis'
          triggerActiveClassName='button--active'
          triggerText='Action'
          triggerTitle='Action'
          direction='down'
          alignment='center' >
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Edit metadata')} className='drop__menu-item dmi-pencil' data-hook='dropdown:close' onClick={this.props.onAction.bind(null, 'edit')}>{t('Edit metadata')}</a></li>
            </ul>
            <ul className='drop__menu drop__menu--iconified' role='menu'>
              <li><a href='#' title={t('Delete project')} className='drop__menu-item drop__menu-item--danger dmi-trash' data-hook='dropdown:close' onClick={this.onDelete}>{t('Delete project')}</a></li>
            </ul>
        </Dropdown>

        {projectWasSetup
          ? <button title={t('Create new scenario')} className='ipa-plus' type='button' onClick={this.props.onAction.bind(null, 'new-scenario')}><span>{t('New scenario')}</span></button>
          : <button title={t('Finish setup')} className='ipa-tick disabled' type='button' onClick={this.props.onAction.bind(null, 'finish')}><span>{t('Finish setup')}</span></button>
        }

      </div>
    );
  }
});

export default PorjectHeaderActions;
