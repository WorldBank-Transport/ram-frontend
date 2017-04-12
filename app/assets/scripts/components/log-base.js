'use strict';
import React, { PropTypes as T } from 'react';
// import TimeAgo from 'timeago-react';
// import Alert from '../components/alert';

export default class LogBase extends React.Component {
  constructor (props) {
    super(props);
    this.timeout = null;

    this.onDismiss.bind(this);

    // Initial state.
    this.state = {
      stickSuccess: false
    };
  }

  startPolling () {
    this.timeout = setTimeout(() => this.props.update(), 2000);
  }

  onDismiss () {
    this.setState({stickSuccess: false});
  }

  componentWillUnmount () {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  componentDidMount () {
    if (this.props.data && this.props.data.status === 'running') {
      // console.log('componentDidMount timeout');
      this.startPolling();
    }
  }

  componentWillReceiveProps (nextProps) {
    // Continue polling while the status is 'running';
    if (nextProps.data && nextProps.data.status === 'running' &&
    this.props.receivedAt !== nextProps.receivedAt) {
      // console.log('componentWillReceiveProps timeout');
      this.startPolling();
    }

    // If when the final messages comes through the user is on the page we
    // want the message to be sticky. For that check that the user received
    // at least one message that's not the last one.
    if (nextProps.data) {
      let l = nextProps.data.logs.length;
      if (l === 0 || nextProps.data.logs[l - 1].code !== this.props.lastMessageCode) {
        this.setState({stickSuccess: true});
      }
    }
  }

  renderLog (log) {
    return <p>LogBase should not be used direclty. Extend the class and implement renderLog(log)</p>;
    // switch (log.code) {
    //   case 'error':
    //     let e = typeof log.data.error === 'string' ? log.data.error : 'Unknown error';
    //     return (
    //       <Alert type='danger'>
    //         <h6>An error occurred <TimeAgo datetime={log.created_at} /></h6>
    //         <p>{e}</p>
    //       </Alert>
    //     );
    //   case this.props.lastMessageCode:
    //     return (
    //       <Alert type='success' dismissable onDismiss={this.onDismiss}>
    //         <h6>Success!<TimeAgo datetime={log.created_at} /></h6>
    //         <p>{log.data.message}</p>
    //       </Alert>
    //     );
    //   default:
    //     return (
    //       <Alert type='info'>
    //         <h6>Finishing setup <TimeAgo datetime={log.created_at} /></h6>
    //         <p>{log.data.message}</p>
    //       </Alert>
    //     );
    // }
  }

  render () {
    const logData = this.props.data;
    if (!logData) return null;

    if (!this.state.stickSuccess && logData.status === 'complete' && !logData.errored) return null;

    if (!logData.logs.length) return null;

    let lastLog = logData.logs[logData.logs.length - 1];

    return this.renderLog(lastLog);
  }
}

LogBase.propTypes = {
  lastMessageCode: T.string,
  data: T.object,
  receivedAt: T.number,
  update: T.func
};

// Specifies the default values for props:
LogBase.defaultProps = {
  lastMessageCode: 'success'
};
