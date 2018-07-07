import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

export default class Sticky extends Component {
  static propTypes = {
    topOffset: PropTypes.number,
    bottomOffset: PropTypes.number,
    relative: PropTypes.bool,
    children: PropTypes.func.isRequired,
    top: PropTypes.number,
    onSticky: PropTypes.func,
    onUnSticky: PropTypes.func,
    className: PropTypes.string
  };

  static defaultProps = {
    relative: false,
    topOffset: 0,
    bottomOffset: 0,
    disableCompensation: false,
    disableHardwareAcceleration: false
  };

  static contextTypes = {
    subscribe: PropTypes.func,
    unsubscribe: PropTypes.func,
    getParent: PropTypes.func
  };

  state = {
    isSticky: false,
    wasSticky: false,
    style: {}
  };

  componentWillMount() {
    if (!this.context.subscribe)
      throw new TypeError(
        "Expected Sticky to be mounted within StickyContainer"
      );

    this.context.subscribe(this.handleContainerEvent);
  }

  componentWillUnmount() {
    this.context.unsubscribe(this.handleContainerEvent);
  }

  componentDidUpdate() {
    this.placeholder.style.paddingBottom = this.props.disableCompensation
      ? 0
      : `${this.state.isSticky ? this.state.calculatedHeight : 0}px`;
  }

  handleContainerEvent = ({
    distanceFromTop,
    distanceFromBottom,
    eventSource
  }) => {
    const parent = this.context.getParent();

    let preventingStickyStateChanges = false;
    if (this.props.relative) {
      preventingStickyStateChanges = eventSource !== parent;
      distanceFromTop =
        -(eventSource.scrollTop + eventSource.offsetTop) +
        this.placeholder.offsetTop;
    }

    const placeholderClientRect = this.placeholder.getBoundingClientRect();
    const contentClientRect = this.content.getBoundingClientRect();
    const calculatedHeight = contentClientRect.height;

    const bottomDifference =
      distanceFromBottom - this.props.bottomOffset - calculatedHeight;

    const wasSticky = !!this.state.isSticky;
    const isSticky = preventingStickyStateChanges
      ? wasSticky
      : distanceFromTop <= -this.props.topOffset &&
        distanceFromBottom > -this.props.bottomOffset;

    distanceFromBottom =
      (this.props.relative
        ? parent.scrollHeight - parent.scrollTop
        : distanceFromBottom) - calculatedHeight;

    const style = !isSticky
      ? {}
      : {
          position: "fixed",
          top:
            this.props.top !== undefined ? this.props.top : (bottomDifference > 0
              ? this.props.relative
                ? parent.offsetTop - parent.offsetParent.scrollTop
                : 0
              : bottomDifference),
          left: placeholderClientRect.left,
          width: placeholderClientRect.width
        };

    const className = this.props.className + (!isSticky ? '' : ' fixed')

    if (!this.props.disableHardwareAcceleration) {
      style.transform = "translateZ(0)";
    }

    if (isSticky) {
      if (this.props.onSticky) {
        this.props.onSticky()
      }
    } else {
      if (this.props.onUnSticky) {
        this.props.onUnSticky()
      }
    }

    this.setState({
      isSticky,
      wasSticky,
      distanceFromTop,
      distanceFromBottom,
      calculatedHeight,
      style,
      className
    });
  };

  render() {
    const element = React.cloneElement(
      this.props.children({
        isSticky: this.state.isSticky,
        wasSticky: this.state.wasSticky,
        distanceFromTop: this.state.distanceFromTop,
        distanceFromBottom: this.state.distanceFromBottom,
        calculatedHeight: this.state.calculatedHeight,
        style: this.state.style,
        className: this.state.className
      }),
      {
        ref: content => {
          this.content = ReactDOM.findDOMNode(content);
        }
      }
    );

    return (
      <div>
        <div ref={placeholder => (this.placeholder = placeholder)} />
        {element}
      </div>
    );
  }
}
