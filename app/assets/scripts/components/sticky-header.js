'use strict';
import React, { PropTypes as T } from 'react';
import { omit } from 'lodash';
import c from 'classnames';

import { Sticky } from 'react-sticky';

const StickyHeader = React.createClass({
  propTypes: {
    children: T.node
  },

  renderer: function ({ style, isSticky }) {
    let props = omit(this.props, ['style', 'children']);
    props.className = c(props.className, {
      'inpage__header--sticky': isSticky
    });

    return (
      <header {...props} style={style}>
        <div className='inner'>
          {this.props.children}
        </div>
      </header>
    );
  },

  render: function () {
    return (
      <Sticky>
        {this.renderer}
      </Sticky>
    );
  }
});

export default StickyHeader;
