'use strict';
import React, { PropTypes as T } from 'react';
import { t } from '../utils/i18n';

const Alert = React.createClass({

  propTypes: {
    type: T.string,
    dismissable: T.bool,
    onDismiss: T.func,
    children: T.array
  },

  render: function () {
    return (
      <div className={`alert alert--${this.props.type}`} role='alert'>
        {this.props.dismissable ? (
          <button className='alert__button-dismiss' title={t('Dismiss alert')} onClick={this.props.onDismiss}><span>{t('Dismiss')}</span></button>
        ) : null}
        {this.props.children}
      </div>
    );
  }
});

export default Alert;
