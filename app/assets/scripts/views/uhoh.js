'use strict';
import React from 'react';
import { Link, IndexLink } from 'react-router';

var UhOh = React.createClass({
  displayName: 'UhOh',

  render: function () {
    return (
      <section className='inpage inpage--uhoh'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>Page not found</h1>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <div className='prose prose--responsive'>
              <p>The requested page does not exist or may have been removed.</p>
              <p>Visit the <IndexLink to='/' title='Visit projects page'>Projects page</IndexLink> or <a href='mailto:email@domain.com' title='Get in touch'>contact us</a> about the problem.</p>
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
