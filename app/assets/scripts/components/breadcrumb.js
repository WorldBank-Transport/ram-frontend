'use strict';
import React, { PropTypes as T } from 'react';
import { Link } from 'react-router';
import _ from 'lodash';

import { getLanguage } from '../utils/i18n';

const Breadcrumb = React.createClass({

  propTypes: {
    items: T.array
  },

  render: function () {
    return (
      <ol className='inpage__breadcrumb'>
        {this.props.items.map(o => <li key={_.kebabCase(o.path)}><Link to={`/${getLanguage()}${o.path}`} title={o.title}>{o.value}</Link></li>)}
      </ol>
    );
  }
});

export default Breadcrumb;
