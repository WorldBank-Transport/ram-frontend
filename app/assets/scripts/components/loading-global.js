'use strict';
import React, { PropTypes as T } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { t } from '../utils/i18n';

const LoadingGlobal = React.createClass({

  propTypes: {
    revealed: T.bool
  },

  renderLoading: function () {
    return (
      <div className='loading-pane'>
        <div className='inner'>
          <p>{t('Loading')}</p>
        </div>
      </div>
    );
  },

  render: function () {
    return (
      <ReactCSSTransitionGroup
        component='div'
        transitionName='loading-pane'
        transitionEnterTimeout={300}
        transitionLeaveTimeout={300} >

        {this.props.revealed ? this.renderLoading() : null}

      </ReactCSSTransitionGroup>
    );
  }
});

export default LoadingGlobal;
