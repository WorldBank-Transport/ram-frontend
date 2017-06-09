'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fileTypesMatrix } from '../../utils/constants';

const ProjectSetupBlock = React.createClass({

  propTypes: {
    type: T.string,
    complete: T.bool
  },

  render: function () {
    let { display, description } = fileTypesMatrix[this.props.type];

    return (
      <section className={c(`card psb psb--${this.props.type}`, {'psb--complete': this.props.complete})}>
        <div className='card__contents'>
          <header className='card__header'>
            <div className='card__headline'>
              <a title='Edit detail' className='link-wrapper' href='#'>
                <h1 className='card__title'>{display}</h1>
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
              <p>{description}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
});

export default ProjectSetupBlock;
