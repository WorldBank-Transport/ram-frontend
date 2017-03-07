'use strict';
import React from 'react';

import NavGlobalMenu from '../components/nav-global-menu';
import { t } from '../utils/i18n';

const Footer = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <footer className='page__footer' role='contentinfo'>
        <div className='inner'>
          <nav className='page__footer-nav' role='navigation'>
            <NavGlobalMenu />
          </nav>
          <div className='footer-credits'>
            <p>{t('Rural Road Accessibility')} <small>2017 © <a href='http://www.worldbank.org/' title={t('Visit website')}>{t('The World Bank Group')}</a></small></p>
          </div>
        </div>
      </footer>
    );
  }
});

export default Footer;
