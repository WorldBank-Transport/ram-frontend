'use strict';
import React from 'react';
import { IndexLink } from 'react-router';

import { t } from '../utils/i18n';

var UhOh = React.createClass({
  displayName: 'UhOh',

  render: function () {
    return (
      <section className='inpage inpage--uhoh'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>{t('Page not found')}</h1>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <div className='prose prose--responsive'>
              <p>{t('The requested page does not exist or may have been removed.')}</p>
              <p>Visit the <IndexLink to='/' title='Visit projects page'>Projects page</IndexLink> or <a href='mailto:email@domain.com' title='Get in touch'>contact us</a> about the problem.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

export default UhOh;
