'use strict';
import React from 'react';
import TetherComponent from 'react-tether';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const Dropdown = React.createClass({
  displayName: 'Dropdown',

  propTypes: {
    id: React.PropTypes.string,
    onChange: React.PropTypes.func,

    triggerElement: React.PropTypes.oneOf(['a', 'button']),
    triggerClassName: React.PropTypes.string,
    triggerActiveClassName: React.PropTypes.string,
    triggerTitle: React.PropTypes.string,
    triggerText: React.PropTypes.string.isRequired,

    direction: React.PropTypes.oneOf(['up', 'down', 'left', 'right']),
    alignment: React.PropTypes.oneOf(['left', 'center', 'right']),

    className: React.PropTypes.string,
    children: React.PropTypes.node
  },

  _bodyListener: function (e) {
    // Get the dropdown that is a parent of the clicked element. If any.
    let theSelf = e.target;
    if (theSelf.tagName === 'BODY' ||
        theSelf.tagName === 'HTML' ||
        e.target.getAttribute('data-hook') === 'dropdown:close') {
      this.close();
      return;
    }

    // If the trigger element is an "a" the target is the "span", but it is a
    // button, the target is the "button" itself.
    // This code handles this case. No idea why this is happening.
    // TODO: Unveil whatever black magic is at work here.
    if (theSelf.tagName === 'SPAN' &&
        theSelf.parentNode === this.triggerRef &&
        theSelf.parentNode.getAttribute('data-hook') === 'dropdown:btn') {
      return;
    }
    if (theSelf.tagName === 'SPAN' &&
        theSelf.parentNode.getAttribute('data-hook') === 'dropdown:close') {
      this.close();
      return;
    }

    if (theSelf && theSelf.getAttribute('data-hook') === 'dropdown:btn') {
      if (theSelf !== this.triggerRef) {
        this.close();
      }
      return;
    }

    do {
      if (theSelf && theSelf.getAttribute('data-hook') === 'dropdown:content') {
        break;
      }
      theSelf = theSelf.parentNode;
    } while (theSelf && theSelf.tagName !== 'BODY' && theSelf.tagName !== 'HTML');

    if (theSelf !== this.dropdownRef) {
      this.close();
    }
  },

  getDefaultProps: function () {
    return {
      triggerElement: 'button',
      direction: 'down',
      alignment: 'center'
    };
  },

  getInitialState: function () {
    return {
      open: false
    };
  },

  // Lifecycle method.
  // Called once as soon as the component has a DOM representation.
  componentDidMount: function () {
    window.addEventListener('click', this._bodyListener);
  },

  // Lifecycle method.
  componentWillUnmount: function () {
    window.removeEventListener('click', this._bodyListener);
  },

  _toggleDropdown: function (e) {
    e.preventDefault();
    this.toggle();
  },

  toggle: function () {
    this.setState({ open: !this.state.open });
  },

  open: function () {
    !this.state.open && this.setState({ open: true });
  },

  close: function () {
    this.state.open && this.setState({ open: false });
  },

  renderTriggerElement: function () {
    let {
      id,
      triggerTitle,
      triggerText,
      triggerClassName,
      triggerActiveClassName,
      triggerElement: TriggerElement
    } = this.props;

    let triggerKlasses = ['drop__toggle'];
    let triggerProps = {
      onClick: this._toggleDropdown,
      'data-hook': 'dropdown:btn',
      ref: el => { this.triggerRef = el; }
    };

    if (triggerClassName) {
      triggerKlasses.push(triggerClassName);
    }

    if (this.state.open && triggerActiveClassName) {
      triggerKlasses.push(triggerActiveClassName);
    }

    triggerProps.className = triggerKlasses.join(' ');

    // Additional trigger props.
    if (TriggerElement === 'button') {
      triggerProps.type = 'button';
    } else {
      triggerProps.href = '#';
      if (id) {
        triggerProps.href += id;
      }
    }
    if (triggerTitle) {
      triggerProps.title = triggerTitle;
    }

    return (
      <TriggerElement {...triggerProps} >
          <span>{ triggerText }</span>
      </TriggerElement>
    );
  },

  renderContent: function () {
    let { id, direction, className } = this.props;

    // Base and additional classes for the trigger and the content.
    let klasses = ['drop__content', 'drop__content--react', `drop-trans--${direction}`];
    let dropdownContentProps = {
      ref: el => { this.dropdownRef = el; },
      'data-hook': 'dropdown:content'
    };

    if (className) {
      klasses.push(className);
    }

    dropdownContentProps.className = klasses.join(' ');

    if (id) {
      dropdownContentProps.id = id;
    }

    return (
    <ReactCSSTransitionGroup
      component='div'
      transitionName='drop-trans'
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300} >
        { this.state.open
          ? <TransitionItem
              props={dropdownContentProps}
              onChange={this.props.onChange}
            >{ this.props.children }</TransitionItem>
        : null }
    </ReactCSSTransitionGroup>
    );
  },

  render: function () {
    let { alignment, direction } = this.props;

    if (direction === 'left' || direction === 'right') {
      if (alignment !== 'center') {
        console.error(`Dropdown: alignment "${alignment}" is not supported. Defaulting to "center"`);
      }
      // When left and right "center" becomes "middle".
      alignment = 'middle';
    }

    let tetherAttachment;
    let tetherTargetAttachment;
    switch (direction) {
      case 'up':
        tetherAttachment = `bottom ${alignment}`;
        tetherTargetAttachment = `top ${alignment}`;
        break;
      case 'down':
        tetherAttachment = `top ${alignment}`;
        tetherTargetAttachment = `bottom ${alignment}`;
        break;
      case 'right':
        tetherAttachment = `${alignment} left`;
        tetherTargetAttachment = `${alignment} right`;
        break;
      case 'left':
        tetherAttachment = `${alignment} right`;
        tetherTargetAttachment = `${alignment} left`;
        break;
    }

    return (
      <TetherComponent
        attachment={tetherAttachment}
        targetAttachment={tetherTargetAttachment}
        constraints={[{
          to: 'scrollParent',
          attachment: 'together'
        }]}>
        {this.renderTriggerElement()}
        {this.renderContent()}
      </TetherComponent>
    );
  }
});

module.exports = Dropdown;

const TransitionItem = React.createClass({
  displayName: 'TransitionItem',

  propTypes: {
    onChange: React.PropTypes.func,
    props: React.PropTypes.object,
    children: React.PropTypes.node
  },

  componentDidMount: function () {
    this.props.onChange && this.props.onChange(true);
  },

  componentWillUnmount: function () {
    this.props.onChange && this.props.onChange(false);
  },

  render: function () {
    return <div {...this.props.props}>{ this.props.children }</div>;
  }
});
