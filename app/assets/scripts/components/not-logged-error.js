'use strict';
import React from 'react';
import { Link } from 'react-router';

import { t } from '../utils/i18n';

import StickyHeader from './sticky-header';

class NotLoggedError extends React.Component {
  render () {
    return (
      <section className='inpage inpage--uhoh'>
        <StickyHeader className='inpage__header'>
          <div className='inpage__headline'>
            <h1 className='inpage__title' title={t('Hello stranger')}>{t('Hello stranger')}</h1>
          </div>
        </StickyHeader>
        <div className='inpage__body'>
          <div className='inner'>
            <div className='prose prose--responsive'>
              <p>{t('The access is reserved for authenticated users.')}</p>
              <p>{t('Please {login} ', {
                login: <Link to='/login' title={t('Login')}>{t('Login')}</Link>
              })}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default NotLoggedError;
