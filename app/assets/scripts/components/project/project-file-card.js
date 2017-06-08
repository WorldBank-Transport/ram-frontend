'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fetchJSON } from '../../actions';
import config from '../../config';
import { t } from '../../utils/i18n';

import ProjectSetupBlock from './project-setup-block';
import { showConfirm } from '../confirmation-prompt';

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
    showConfirm({
      title: t('Delete file'),
      body: (
        <p>{t('Are you sure you want to delete {name} file?', {name: <strong>{this.props.name}</strong>})}</p>
      )
    }, () => {
      const { type, projectId, scenarioId, fileId } = this.props;

      let url;
      switch (type) {
        case 'profile':
        case 'admin-bounds':
        case 'origins':
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
    });
  },

  render: function () {
    const { type, projectId, scenarioId, fileId } = this.props;

    let downloadLink;
    switch (type) {
      case 'profile':
      case 'admin-bounds':
      case 'origins':
        downloadLink = `${config.api}/projects/${projectId}/files/${fileId}?download=true`;
        break;
      case 'poi':
      case 'road-network':
        downloadLink = `${config.api}/projects/${projectId}/scenarios/${scenarioId}/files/${fileId}?download=true`;
        break;
    }

    return (
      <ProjectSetupBlock
        name={this.props.name}
        description={this.props.description}
        complete >

        <div className='psb__actions'>
          <button type='button' className={c('psba-trash', {'disabled': this.state.loading})} onClick={this.onRemove}><span>{t('Remove')}</span></button>
          <a href={downloadLink} title={t('Download file')} className='psba-download'><span>{t('Download')}</span></a>
        </div>
      </ProjectSetupBlock>
    );
  }
});

export default ProjectFileCard;
