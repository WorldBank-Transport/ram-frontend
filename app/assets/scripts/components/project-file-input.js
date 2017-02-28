'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import { fetchJSON } from '../actions';
import config from '../config';

const ProjectFileInput = React.createClass({

  propTypes: {
    name: T.string,
    description: T.string,
    type: T.string,
    projectId: T.number,
    onFileUploadComplete: T.func
  },

  getInitialState: function () {
    return {
      file: null,
      size: 0,
      uploaded: 0,
      loading: false
    };
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

    const { type, projectId } = this.props;

    let url;
    switch (type) {
      case 'profile':
      case 'admin-bounds':
      case 'villages':
        url = `${config.api}/projects/${projectId}/upload?type=${type}`;
        break;
      case 'poi':
      case 'road-network':
        throw new Error('not implemented');
        break;
    }

    this.setState({loading: true});

    fetchJSON(url)
      .then(res => {
        const { presignedUrl } = res;
        const xhr = new window.XMLHttpRequest();

        xhr.upload.addEventListener('progress', (evt) => {
          if (evt.lengthComputable) {
            this.setState({uploaded: evt.loaded});
          }
        }, false);

        xhr.onreadystatechange = e => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            this.setState(this.getInitialState());
            this.props.onFileUploadComplete();
          }
        };

        // start upload
        xhr.open('PUT', presignedUrl, true);
        xhr.send(file);
      })
      .catch(err => {
        console.log('err', err);
        throw new Error(err.error);
      });
  },

  render: function () {
    return (
      <form className='file-input'>
        <h2>{this.props.name}</h2>
        <input type='file' className='form__control--upload' ref='file' onChange={this.onFileSelected}/>
        <p>{this.props.description}</p>
        <button type='button' className={c('button button--primary', {'disabled': this.state.loading || !this.state.file})} onClick={this.onSumbit}><span>Upload</span></button>
        {this.state.file !== null
          ? <div>{Math.round(this.state.uploaded / (1024 * 1024))}MB / {Math.round(this.state.size / (1024 * 1024))}MB</div>
          : null
        }
      </form>
    );
  }
});

export default ProjectFileInput;
