'use strict';
import React, { PropTypes as T } from 'react';
import { Link } from 'react-router';

import { t, getLanguage } from '../utils/i18n';

const NavGlobalMenu = React.createClass({

  propTypes: {
    showAuth: T.bool,
    isAuthenticated: T.bool
  },

  render: function () {
    let {isAuthenticated, showAuth} = this.props;
    return (
      <ul className='nav-global-menu'>
        <li><Link to={`/${getLanguage()}/projects`} title={t('Visit projects page')}><span>{t('Projects')}</span></Link></li>
        <li><Link to={`/${getLanguage()}/about`} title={t('Visit about page')}><span>{t('About')}</span></Link></li>
        <li><a href='http://ruralaccess.info' target='_blank' title={t('Visit help page')}><span>{t('Help')}</span></a></li>
        {showAuth &&
            <li> {!isAuthenticated && <Link to={`/login?return=${window.location.hash.slice(1)}`}><span>{t('Login')}</span></Link>}
                  {isAuthenticated && <Link to={`/logout?return=${window.location.hash.slice(1)}`}><span>{t('Logout')}</span></Link>}
            </li>
        }
      </ul>
    );
  }
});

export default NavGlobalMenu;
