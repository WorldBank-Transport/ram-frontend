'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { t } from '../utils/i18n';

const Alert = React.createClass({

  propTypes: {
    type: T.string,
    dismissable: T.bool,
    autoDismiss: T.number,
    popover: T.bool,
    onDismiss: T.func,
    children: T.node
  },

  timeout: null,

  onDismiss: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.props.onDismiss();
  },

  componentDidMount: function () {
    if (this.props.autoDismiss > 0) {
      this.timeout = setTimeout(() => this.onDismiss(), this.props.autoDismiss);
    }
  },

  componentWillUnmount: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  render: function () {
    let cl = c('alert', `alert--${this.props.type}`, {
      'alert--popover': this.props.popover
    });
    return (
      <div className={cl} role='alert'>
        {this.props.dismissable ? (
          <button className='alert__button-dismiss' title={t('Dismiss alert')} onClick={this.onDismiss}><span>{t('Dismiss')}</span></button>
        ) : null}
        {this.props.children}
      </div>
    );
  }
});

export default Alert;
