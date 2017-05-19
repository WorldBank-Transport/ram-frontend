'use strict';
import React from 'react';
import { IndexLink } from 'react-router';

import { t } from '../utils/i18n';

import StickyHeader from './sticky-header';

const FatalError = React.createClass({
  render: function () {
    return (
      <section className='inpage inpage--uhoh'>
        <StickyHeader className='inpage__header'>
          <div className='inpage__headline'>
            <h1 className='inpage__title' title={t('Something went wrong')}>{t('Something went wrong')}</h1>
          </div>
        </StickyHeader>
        <div className='inpage__body'>
          <div className='inner'>
            <div className='prose prose--responsive'>
              <p>{t('An error occurred trying to reach the server. Please try again later.')}</p>
              <p>{t('In the mean time visit the {link} for more information or if the error persists {mail} about the problem.', {
                link: <IndexLink to='/' title={t('Visit about page')}>{t('About page')}</IndexLink>,
                mail: <a href='mailto:email@domain.com' title={t('Get in touch')}>{t('contact us')}</a>
              })}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
});

export default FatalError;
