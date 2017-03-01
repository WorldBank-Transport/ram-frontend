'use strict';
import React from 'react';
import { Link } from 'react-router';

import { getLanguage } from '../utils/i18n';

import NavGlobalMenu from '../components/nav-global-menu';

const Header = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <header className='page__header' role='banner'>
        <div className='inner'>
          <div className='page__headline'>
            <Link to={`/${getLanguage()}/`} title='Visit page'><h1 className='page__title'>Rural Road Accessibility</h1></Link>
          </div>
          <nav className='page__prime-nav' role='navigation'>
            <div className='nav-language-switcher drop drop--down drop--align-left'>
              <a href='#lang-switcher' title='Change language' className='drop__toggle drop__toggle--caret'><span>English</span></a>
              <div className='drop__content' id='lang-switcher'>
                <h6 className='drop__title'>Change language</h6>
                <ul className='drop__menu drop__menu--select' role='menu'>
                  <li><a href='#' title='Select language' className='drop__menu-item drop__menu-item--active'>English</a></li>
                  <li><a href='#' title='Select language' className='drop__menu-item'>Language 2</a></li>
                </ul>
              </div>
            </div>

            <NavGlobalMenu />
          </nav>
        </div>
      </header>
    );
  }
});

export default Header;
