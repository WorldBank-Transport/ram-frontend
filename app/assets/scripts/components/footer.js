import React from 'react';

const Footer = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <footer className='page__footer' role='contentinfo'>
        <div className='inner'>
          <p>
            Rural Road Accessibility
            <small>2017 © World Bank Group</small>
          </p>
        </div>
      </footer>
    );
  }
});

export default Footer;
