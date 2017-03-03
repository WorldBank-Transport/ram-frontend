'use strict';
import React from 'react';

import { t, getLanguage, getLanguageName, getAvailableLanguages } from '../utils/i18n';

const LoadingGlobal = React.createClass({

  propTypes: {},

  render: function () {
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
