'use strict';
import React from 'react';
import { Link, IndexLink } from 'react-router';

const Header = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <header className='page__header' role='banner'>
        <div className='inner'>
          <div className='page__headline'>
            <a href='/' title='Visit page'>
              <h1 className='page__title'>Rural Road Accessibility</h1>
            </a>
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

            <ul className='nav-global-menu'>
              <li><IndexLink to='/' title='Visit projects page'><span>Projects</span></IndexLink></li>
              <li><Link to='/about' title='Visit about page'><span>About</span></Link></li>
              <li><Link to='/help' title='Visit help page'><span>Help</span></Link></li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }
});

export default Header;
