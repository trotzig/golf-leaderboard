import React from 'react';

function defer(callback) {
  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.requestAnimationFrame(callback);
  return () => window.cancelAnimationFrame(id);
}

export default class Lazy extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: true };
    this.handleRef = this.handleRef.bind(this);

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.state = { visible: false };
    // eslint-disable-next-line no-undef
    this.observer = new IntersectionObserver(
      entries => {
        if (this.cancelDefer) {
          this.cancelDefer();
        }
        this.cancelDefer = defer(() =>
          this.setState({ visible: entries[0].isIntersecting }),
        );
      },
      {
        rootMargin: '474% 0px 474% 0px',
      },
    );
  }

  componentDidMount() {
    if (!this.observer) return;
    this.observer.observe(this.element);
  }

  componentWillUnmount() {
    if (!this.observer) return;
    this.observer.unobserve(this.element);
  }

  handleRef(element) {
    if (!element) {
      return;
    }
    this.element = element;
  }

  render() {
    const { visible } = this.state;
    const { children, minHeight, minWidth, className } = this.props;

    return (
      <div
        ref={this.handleRef}
        className={className}
        style={{
          minHeight,
          minWidth,
        }}
      >
        {visible && children}
      </div>
    );
  }
}
