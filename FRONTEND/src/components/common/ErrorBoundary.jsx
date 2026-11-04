import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="bg-page flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-shell">
          <h1 className="text-2xl font-semibold text-brand">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">The page hit an unexpected error. Reloading usually fixes it.</p>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white">Reload</button>
        </div>
      </div>
    );
  }
}
