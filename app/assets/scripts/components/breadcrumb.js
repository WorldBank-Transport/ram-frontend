'use strict';
import React from 'react';
import { Link } from 'react-router';

import { t, getLanguage } from '../utils/i18n';

const Breadcrumb = React.createClass({

  propTypes: {},

  render: function () {
    return (
      <ol className='inpage__breadcrumb'>
        <li><Link to={`/${getLanguage()}/projects`} title='Visit projects page'>Projects</Link></li>
      </ol>
    );
  }
});

export default Breadcrumb;