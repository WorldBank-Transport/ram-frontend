'use strict';
import React, { PropTypes as T } from 'react';

import { showConfirm } from '../confirmation-prompt';
import { t } from '../../utils/i18n';

var ScenarioDeleteAction = React.createClass({
  propTypes: {
    name: T.string,
    isMaster: T.bool,
    onDeleteConfirm: T.func
  },

  onClick: function (e) {
    e.preventDefault();

    if (this.props.isMaster) {
      return;
    }

    showConfirm({
      title: t('Delete scenario'),
      body: (
        <div>
          <p>{t('Are you sure you want to delete {name}?', {name: <strong>{this.props.name}</strong>})}</p>
        </div>
      )
    }, () => {
      this.props.onDeleteConfirm();
    });
  },

  render: function () {
    let props = {
      className: 'drop__menu-item drop__menu-item--danger dmi-trash',
      'data-hook': 'dropdown:close',
      onClick: this.onClick
    };

    if (this.props.isMaster) {
      props.className += ' visually-disabled';
      props['data-tip'] = true;
      props['data-for'] = 'tip-no-delete';
    }

    return <a href='#' title={t('Delete scenario')} {...props}>{t('Delete scenario')}</a>;
  }
});

export default ScenarioDeleteAction;
