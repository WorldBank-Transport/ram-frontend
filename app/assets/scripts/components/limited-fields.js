'use strict';
import React, { PropTypes as T } from 'react';
import _ from 'lodash';

const LimitedField = React.createClass({
  propTypes: {
    fieldType: T.string,
    limit: T.number,
    value: T.string,
    onChange: T.func
  },

  onChange: function (e) {
    let v = e.target.value;
    let limit = this.props.limit;
    // If the limit has been reached and the new value is more than the limit
    // just ignore the action.
    if (this.props.value.length >= limit && v.length >= limit) {
      return;
    }

    if (v.length > limit) {
      e.target.value = v.substr(0, limit);
    }
    this.props.onChange(e);
  },

  render: function () {
    let props = _.omit(this.props, ['fieldType', 'limit', 'onChange']);

    switch (this.props.fieldType) {
      case 'textinput':
        return <input type='text' onChange={this.onChange} {...props}/>;
      case 'textarea':
        return <textarea onChange={this.onChange} {...props}></textarea>;
    }
  }
});

export const Textarea = (props) => {
  return (
    <LimitedField fieldType='textarea' {...props}/>
  );
};

export const TextInput = (props) => {
  return (
    <LimitedField fieldType='textinput' {...props}/>
  );
};
