import React from 'react';
import ReactDOM from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught MarkForge Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#0b0d14', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', textAlign: 'center' }}>
          <h2 style={{ color: '#c084fc', marginBottom: 12 }}>MarkForge Application Error</h2>
          <p style={{ color: '#94a3b8', maxWidth: 500, marginBottom: 20 }}>
            An unexpected error occurred. You can reload the app to continue editing.
          </p>
          <pre style={{ background: '#1e293b', padding: 16, borderRadius: 8, maxWidth: 600, overflowX: 'auto', textAlign: 'left', fontSize: 13, color: '#f87171' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Theme appearance="dark" accentColor="violet" grayColor="slate" radius="large" scaling="100%">
        <App />
      </Theme>
    </ErrorBoundary>
  </React.StrictMode>
);
