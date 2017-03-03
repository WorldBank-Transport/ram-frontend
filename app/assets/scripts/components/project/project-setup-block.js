'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

const ProjectSetupBlock = React.createClass({

  propTypes: {
    name: T.string,
    description: T.string,
    complete: T.bool,
    children: T.object
  },

  render: function () {
    return (
      <section className={c('psb', {'psb--complete': this.props.complete})}>
        <div className='inner'>
          <header className='psb__header'>
            <h1 className='psb__title'>{this.props.name}</h1>
            <div className='psb__description'>
              <p>{this.props.description}</p>
            </div>
          </header>
          <div className='psb__body'>
            {this.props.children}
          </div>
        </div>
      </section>
    );
  }
});

export default ProjectSetupBlock;
