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
            <ul className='nav-menu'>
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
