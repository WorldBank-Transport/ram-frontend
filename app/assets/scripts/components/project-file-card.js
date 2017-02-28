'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fetchJSON } from '../actions';
import config from '../config';

const ProjectFileCard = React.createClass({

  propTypes: {
    fileId: T.number,
    name: T.string,
    type: T.string,
    projectId: T.number,
    description: T.string,
    onFileDeleteComplete: T.func
  },

  getInitialState: function () {
    return {
      loading: false
    };
  },

  onRemove: function () {
    const { type, projectId, fileId } = this.props;

    let url;
    switch (type) {
      case 'profile':
      case 'admin-bounds':
      case 'villages':
        url = `${config.api}/projects/${projectId}/files/${fileId}`;
        break;
      case 'poi':
      case 'road-network':
        throw new Error('not implemented');
        break;
    }

    fetchJSON(url, {method: 'DELETE'})
      .then(res => {
        this.setState(this.getInitialState());
        this.props.onFileDeleteComplete();
      })
      .catch(err => {
        console.log('err', err);
        throw new Error(err.error);
      });
  },

  render: function () {
    return (
      <div className='file-card'>
        <h2>{this.props.name}</h2>
        <strong>File was uploaded</strong>
        <p>{this.props.description}</p>
        <button type='button' className={c('button button--secondary', {'disabled': this.state.loading})} onClick={this.onRemove}><span>Remove</span></button>
      </div>
    );
  }
});

export default ProjectFileCard;
