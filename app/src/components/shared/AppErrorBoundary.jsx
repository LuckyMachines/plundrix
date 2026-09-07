import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Plundrix interface error', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-vault-dark px-6 py-16 text-vault-text" id="main-content">
        <section className="mx-auto max-w-2xl rounded border border-signal-red/40 bg-vault-surface p-6 sm:p-8">
          <p className="label text-signal-red">Interface interrupted</p>
          <h1 className="mt-3 font-display text-4xl text-vault-text">The vault console hit a snag.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-vault-text-dim">
            Your active Instant Play run is saved on this device. Reload the interface to recover it,
            or return to the hub and start from a clean screen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload interface
            </button>
            <a className="btn-secondary" href="/">
              Return to hub
            </a>
          </div>
        </section>
      </main>
    );
  }
}
