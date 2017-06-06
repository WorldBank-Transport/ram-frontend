'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

const ProjectSetupBlock = React.createClass({

  propTypes: {
    name: T.string,
    description: T.string,
    type: T.string,
    complete: T.bool,
    children: T.object
  },

  render: function () {
    return (
      <section className={c(`card psb psb--${this.props.type}`, {'psb--complete': this.props.complete})}>
        <div className='card__contents'>
          <header className='card__header'>
            <div className='card__headline'>
              <a title='Edit detail' className='link-wrapper' href='#'>
                <h1 className='card__title'>{this.props.name}</h1>
              </a>
              <p className='card__subtitle'>1 Source file</p>
            </div>
            <div className="card__actions actions">
              <ul className="actions__menu">
                <li>
                  <a className="actions__menu-item ca-question" title="Learn more" href="#">
                    <span>What is this?</span>
                  </a>
                </li>
              </ul>
              <ul className="actions__menu">
                <li>
                  <a className="actions__menu-item ca-download" title="Export raw data" href="#">
                    <span>Download</span>
                  </a>
                </li>
                <li>
                  <button className="actions__menu-item ca-pencil" type="button" title="Modify details">
                    <span>Edit</span>
                  </button>
                </li>
              </ul>
            </div>
          </header>
          <div className='card__body'>
            <div className='card__summary'>
              <p>{this.props.description}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
});

export default ProjectSetupBlock;
