'use strict';
import React, { PropTypes as T } from 'react';

import { t } from '../utils/i18n';

const LoadingGlobal = React.createClass({

  propTypes: {
    revealed: T.bool
  },

  render: function () {
    if (!this.props.revealed) {
      return null;
    }

    return (
      <div className='loading-pane'>
        <div className='inner'>
          <p>{t('Loading')}</p>
        </div>
      </div>
    );
  }
});

export default LoadingGlobal;
