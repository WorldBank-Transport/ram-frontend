'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fetchJSON } from '../../actions';
import config from '../../config';

import ProjectSetupBlock from './project-setup-block';

const ProjectFileCard = React.createClass({

  propTypes: {
    fileId: T.number,
    name: T.string,
    type: T.string,
    projectId: T.number,
    scenarioId: T.number,
    description: T.string,
    onFileDeleteComplete: T.func
  },

  getInitialState: function () {
    return {
      loading: false
    };
  },

  onRemove: function () {
    const { type, projectId, scenarioId, fileId } = this.props;

    let url;
    switch (type) {
      case 'profile':
      case 'admin-bounds':
      case 'villages':
        url = `${config.api}/projects/${projectId}/files/${fileId}`;
        break;
      case 'poi':
      case 'road-network':
        url = `${config.api}/projects/${projectId}/scenarios/${scenarioId}/files/${fileId}`;
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
      <ProjectSetupBlock
        name={this.props.name}
        description={this.props.description}
        complete >

        <div className='psb__actions'>
          <button type='button' className={c('psba-trash', {'disabled': this.state.loading})} onClick={this.onRemove}><span>Remove</span></button>
          <a href='#' title='Download file' className='psba-download'><span>Download</span></a>
        </div>
      </ProjectSetupBlock>
    );
  }
});

export default ProjectFileCard;
