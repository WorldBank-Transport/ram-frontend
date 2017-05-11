'use strict';
import React, { PropTypes as T } from 'react';
import { Link } from 'react-router';
import c from 'classnames';

import { t, getLanguage, getLanguageName, getAvailableLanguages } from '../utils/i18n';

import NavGlobalMenu from '../components/nav-global-menu';
import Dropdown from '../components/dropdown';

const Header = React.createClass({

  propTypes: {
    pathname: T.string
  },

  render: function () {
    return (
      <header className='page__header' role='banner'>
        <div className='inner'>
          <div className='page__headline'>
            <Link to={`/${getLanguage()}/`} title={t('Visit page')}><h1 className='page__title'>{t('Rural Road Accessibility')}</h1></Link>
          </div>
          <nav className='page__prime-nav' role='navigation'>

        <div className='nav-language-switcher'>
          <Dropdown
            id='lang-switcher'
            triggerClassName='drop__toggle--caret'
            triggerActiveClassName='active'
            triggerText={getLanguageName()}
            triggerTitle={t('Change language')}
            triggerElement='a'
            direction='down'
            alignment='left' >
              <h6 className='drop__title'>{t('Change language')}</h6>
              <ul className='drop__menu drop__menu--select' role='menu'>
                {getAvailableLanguages().map(l => {
                  let cl = c('drop__menu-item', {
                    'drop__menu-item--active': l.key === getLanguage()
                  });
                  let url = this.props.pathname.replace(`/${getLanguage()}`, `/${l.key}`);
                  return (
                    <li key={l.key}>
                      <Link to={url} title={t('Select language')} className={cl} data-hook='dropdown:close'>{l.name}</Link>
                    </li>
                  );
                })}
              </ul>
          </Dropdown>
        </div>

            <NavGlobalMenu />
          </nav>
        </div>
      </header>
    );
  }
});

export default Header;
