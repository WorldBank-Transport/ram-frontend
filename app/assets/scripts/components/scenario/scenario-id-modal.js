'use strict';
import React, { PropTypes as T } from 'react';
import ReactTooltip from 'react-tooltip';
import c from 'classnames';

import { t } from '../../utils/i18n';
import config from '../../config';
import { showGlobalLoading, hideGlobalLoading } from '../global-loading';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal';

const ScenarioIDModal = React.createClass({

  propTypes: {
    revealed: T.bool,
    onCloseClick: T.func,

    scenarioData: T.object
  },

  setupNotifier: function () {
    var n = notifier('rra-frontend', this.refs.editor.contentWindow);

    n.on('loaded', () => {
      n.send('settings', {
        projectId: this.props.scenarioData.project_id,
        scenarioId: this.props.scenarioData.id
      });
    });

    n.on('ready', () => {
      hideGlobalLoading();
      this.setState({editorLoaded: true});
    });
  },

  getInitialState: function () {
    return {
      editorLoaded: false
    };
  },

  componentDidMount: function () {
  },

  componentDidUpdate: function (prevProps) {
    if (!prevProps.revealed && this.props.revealed) {
      showGlobalLoading();
      this.setupNotifier();
    }
  },

  componentWillReceiveProps: function (nextProps) {
    // When the modal gets closed set the editor and not loaded.
    if (this.props.revealed && !nextProps.revealed) {
      this.setState({editorLoaded: false});
    }
  },

  componentWillUnmount: function () {
  },

  onClose: function () {
    this.props.onCloseClick();
  },

  render: function () {
    return (
      <Modal
        id='modal-scenario-metadata'
        className='modal--large'
        onCloseClick={this.onClose}
        revealed={this.props.revealed} >

        <ModalHeader>
          <div className='modal__headline'>
            <h1 className='modal__title'>{t('Edit road network')}</h1>
            <div className='modal__description'>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>

        <section className='ideditor-wrapper'>
          <h1 className='visually-hidden'>iD editor</h1>
          <iframe src={config.iDEditor} className={c({'visually-hidden': !this.state.editorLoaded})} frameBorder='0' ref='editor'></iframe>
        </section>

        </ModalBody>
        <ModalFooter>
          <button className='mfa-xmark' type='button' onClick={this.onClose}><span>{t('Cancel')}</span></button>
          <button data-tip='Use save button in the editor' data-effect='solid' className='mfa-tick visually-disabled' type='submit'><span>{t('Save')}</span></button>
          <ReactTooltip />
        </ModalFooter>
      </Modal>
    );
  }
});

export default ScenarioIDModal;

/**
 * Communication between iframes
 * @param  {String} id      Id to use for the communication
 * @param  {window} element Window object. (for the iframe is accessible
 *                          through iframe.contentWindow)
 * @return {notifier}       Notifier object.
 */
function notifier (id, element) {
  let events = {};

  let _notifier = {
    on: (type, cb) => {
      if (!events[type]) events[type] = [];
      events[type].push(cb);
      return _notifier;
    },
    send: (type, data = {}) => {
      let msg = Object.assign({}, { id: id, type: type }, data);
      element.postMessage(msg, '*');
      return _notifier;
    }
  };

  window.addEventListener('message', e => {
    if (!e.data.type) return;
    let cbs = events[e.data.type] || [];
    cbs.forEach(cb => cb(e.data));
  });

  return _notifier;
}
