'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fetchJSON } from '../../actions';
import config from '../../config';
import { t } from '../../utils/i18n';

import ProjectSetupBlock from './project-setup-block';

const ProjectFileInput = React.createClass({

  propTypes: {
    name: T.string,
    description: T.string,
    type: T.string,
    projectId: T.number,
    scenarioId: T.number,
    onFileUploadComplete: T.func
  },

  xhr: null,

  getInitialState: function () {
    return {
      file: null,
      size: 0,
      uploaded: 0,
      loading: false
    };
  },

  componentWillUnmount: function () {
    if (this.xhr) {
      this.xhr.abort();
    }
  },

  onFileSelected: function (event) {
    // Store file reference
    const file = event.target.files[0];
    this.setState({
      file,
      size: file.size,
      uploaded: 0
    });
  },

  onSumbit: function () {
    const file = this.state.file;
    if (!file) return;

    const { type, projectId, scenarioId } = this.props;

    let url;
    switch (type) {
      case 'profile':
      case 'admin-bounds':
      case 'villages':
        url = `${config.api}/projects/${projectId}/upload?type=${type}`;
        break;
      case 'poi':
      case 'road-network':
        url = `${config.api}/projects/${projectId}/scenarios/${scenarioId}/upload?type=${type}`;
        break;
    }

    this.setState({loading: true});

    fetchJSON(url)
      .then(res => {
        const { presignedUrl } = res;
        this.xhr = new window.XMLHttpRequest();

        this.xhr.upload.addEventListener('progress', (evt) => {
          if (evt.lengthComputable) {
            this.setState({uploaded: evt.loaded});
          }
        }, false);

        this.xhr.onreadystatechange = e => {
          if (this.xhr.readyState === XMLHttpRequest.DONE) {
            this.setState(this.getInitialState());
            this.props.onFileUploadComplete();
          }
        };

        // start upload
        this.xhr.open('PUT', presignedUrl, true);
        this.xhr.send(file);
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
        complete={false} >

        <form>
          <div className='form__group'>
            <label className='form__label' htmlFor='project-name'>{t('File')}</label>
            <input type='file' className='form__control--upload' ref='file' onChange={this.onFileSelected} />
            {this.state.file !== null
              ? <p className='form__help'>{Math.round(this.state.uploaded / (1024 * 1024))}MB / {Math.round(this.state.size / (1024 * 1024))}MB</p>
              : null
             }
          </div>
          <div className='form__actions'>
            <button type='button' className={c('psba-tick', {'disabled': this.state.loading || !this.state.file})} onClick={this.onSumbit}><span>Save</span></button>
          </div>
        </form>
      </ProjectSetupBlock>
    );
  }
});

export default ProjectFileInput;
