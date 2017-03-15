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
              <p>{t('Visit the {link} or {mail} about the problem.', {
                link: <IndexLink to='/' title={t('Visit projects page')}>{t('Projects page')}</IndexLink>,
                mail: <a href='mailto:email@domain.com' title={t('Get in touch')}>{t('contact us')}</a>
              })}</p>
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
