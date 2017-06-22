'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

export class FileInput extends React.PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      focused: false
    };
  }

  onFileSelect (event) {
    this.props.onFileSelect(event.target.files[0]);
  }

  render () {
    let fieldVal = this.props.value ? this.props.value.name : this.props.placeholder;
    return (
      <div className='form__group'>
        {this.props.label ? <label className='form__label' htmlFor={this.props.id}>{this.props.label}</label> : null}
        <div className={c('form__file', {'form__control--focus': this.state.focused})} onClick={() => { this.refs.file.click(); }}>
          <span className='form__file__text'>{fieldVal}</span>
          <input
            type='file'
            id={this.props.id}
            name={this.props.name}
            placeholder={fieldVal}
            ref='file'
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
            onChange={this.onFileSelect.bind(this)}
          />
        </div>
        {this.props.children}
      </div>
    );
  }
}

FileInput.propTypes = {
  id: T.string,
  name: T.string,
  label: T.string,
  value: T.oneOfType([T.string, T.object]),
  placeholder: T.string,
  onFileSelect: T.func,
  children: T.object
};

export class FileDisplay extends React.PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      focused: false
    };
  }

  render () {
    return (
      <div className='form__group'>
        {this.props.label ? <label className='form__label' htmlFor={this.props.id}>{this.props.label}</label> : null}
        <div className={c('form__file form__file--remove', {'form__control--focus': this.state.focused})} onClick={this.props.onRemoveClick}>
          <span className='form__file__text'>{this.props.value}</span>
          <input
            type='file'
            id={this.props.id}
            name={this.props.name}
            value={this.props.value}
            readOnly
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
          />
        </div>
        {this.props.children}
      </div>
    );
  }
}

FileDisplay.propTypes = {
  id: T.string,
  name: T.string,
  label: T.string,
  value: T.oneOfType([T.string, T.object]),
  placeholder: T.string,
  onRemoveClick: T.func,
  children: T.object
};

