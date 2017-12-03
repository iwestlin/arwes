import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import '../tools/request-animation-frame';

export default class Words extends Component {

  static propTypes = {
    theme: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    animate: PropTypes.bool,
    show: PropTypes.bool,
    timeoutEnter: PropTypes.number,
    layer: PropTypes.oneOf(['', 'primary', 'secondary', 'header', 'control', 'success', 'alert', 'disabled']),
    blinkText: PropTypes.string,
    children: PropTypes.string.isRequired,
  };

  static defaultProps = {
    animate: false,
    show: true,
    layer: '',
    blinkText: '&#9611;',
  };

  // Current animation frame identifier.
  currentAnimationFrame = null;

  constructor () {
    super(...arguments);

    this.state = {
      text: '',
      animating: false,
    };
  }

  componentDidMount () {
    if (this.props.animate && this.props.show) {
      this.animateIn();
    }
  }

  componentDidUpdate (prevProps) {

    const { animate, show, children } = this.props;

    const animateChanged = animate !== prevProps.animate;
    const showChanged = show !== prevProps.show;
    const childrenChanged = children !== prevProps.children;

    // Animation changed
    if (animate) {
      if (showChanged) {
        show ? this.animateIn() : this.animateOut();
      }
      else if (childrenChanged) {
        this.animateIn();
      }
    }

    // Not animated anymore
    if (!animate && animateChanged) {
      this.stopAnimation();
    }
  }

  componentWillUnmount () {
    this.stopAnimation();
  }

  render () {
    const {
      theme,
      classes,
      animate,
      show,
      timeoutEnter,
      layer,
      blinkText,
      className,
      children,
      ...etc
    } = this.props;

    const { animating, text } = this.state;

    const cls = cx(classes.root, {
      [classes.hide]: animate && !show && !animating,
      [classes.animating]: animating
    }, className);

    return (
      <span className={cx(cls)} {...etc}>
        <span className={classes.children}>
          {children}
        </span>
        {animating && (
        <span className={classes.text}>
          {text}
          <span
            className={classes.blink}
            dangerouslySetInnerHTML={{ __html: blinkText }}
          />
        </span>
        )}
      </span>
    );
  }

  animateIn () {
    this.cancelNextAnimation();
    this.startAnimation(true);
  }

  animateOut () {
    this.cancelNextAnimation();
    this.startAnimation(false);
  }

  stopAnimation () {
    this.cancelNextAnimation();
    this.setState({ animating: false });
  }

  cancelNextAnimation () {
    window.cancelAnimationFrame(this.currentAnimationFrame);
  }

  startAnimation (isIn) {
    const { theme, children } = this.props;
    const timeoutEnter = this.props.timeoutEnter || theme.animTime;

    if (children.length === 0) return;

    // 1s / frames per second (FPS)
    // 60 FPS are the default in requestAnimationFrame
    const interval = 1000 / 60;

    // The time it will take to add/remove a character per frame
    const realDuration = interval * children.length;

    // Duration, min is theme.animTime and max is props.timeoutEnter
    const duration = isIn
      ? Math.max(Math.min(realDuration, timeoutEnter), theme.animTime)
      : theme.animTime;

    this.cancelNextAnimation();

    this.setState({
      animating: true,
      text: isIn ? '' : children
    });

    const length = children.length;
    let start = performance.now();
    let progress = null;

    const nextAnimation = (timestamp) => {
      if (!start) {
        start = timestamp;
      }

      progress = Math.max(timestamp - start, 0);
      if (!isIn) {
        progress = duration - progress;
      }

      // partialLength(n) = animationProgressDuration(ms)
      // textTotalLength(n) = totalDuration(ms)
      const newLength = Math.round((progress * length) / duration);
      const text = children.substring(0, newLength);

      this.setState({ text });

      const continueAnimation = isIn
        ? newLength <= length
        : newLength > 0;

      if (continueAnimation) {
        this.currentAnimationFrame = window.requestAnimationFrame(nextAnimation);
      } else {
        this.stopAnimation();
      }
    };

    this.currentAnimationFrame = window.requestAnimationFrame(nextAnimation);
  }
}
