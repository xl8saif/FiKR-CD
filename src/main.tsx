import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import './services/firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Caught by RootErrorBoundary:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0C0C0C] text-[#E5E5E5] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-[#161616] p-6 rounded-2xl border border-[#333] shadow-2xl">
            <h2 className="text-xl font-bold text-[#C9A66B] mb-2 font-serif italic">
              FiKR&CD — Application Recovery
            </h2>
            <p className="text-xs text-[#AAA] mb-4">
              A temporary runtime warning occurred. The application state has been preserved.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] rounded-xl font-bold text-xs transition"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Intercept unhandled promise rejections gracefully in sandboxed iframe preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Handled unhandled rejection in preview context:', event.reason);
    event.preventDefault();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
      <Analytics />
    </RootErrorBoundary>
  </StrictMode>,
);

