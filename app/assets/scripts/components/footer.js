'use strict';
import React from 'react';
import { Link, IndexLink } from 'react-router';

const Footer = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <footer className='page__footer' role='contentinfo'>
        <div className='inner'>
          <nav className='page__footer-nav' role='navigation'>
            <ul className='nav-menu'>
              <li><IndexLink to='/' title='Visit projects page'><span>Projects</span></IndexLink></li>
              <li><Link to='/about' title='Visit about page'><span>About</span></Link></li>
              <li><Link to='/help' title='Visit help page'><span>Help</span></Link></li>
            </ul>
          </nav>
          <div className='footer-credits'>
            <p>Rural Road Accessibility <small>2017 © <a href='http://www.worldbank.org/' title='Visit website'>World Bank Group</a></small></p>
          </div>
        </div>
      </footer>
    );
  }
});

export default Footer;
