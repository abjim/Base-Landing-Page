import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-brand-ivory flex items-center justify-center text-brand-charcoal p-4">
          <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-brand-olive/20 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-brand-charcoal mb-2">Something went wrong</h2>
            <p className="text-brand-charcoal/70 mb-6 text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-brand-olive hover:bg-brand-leaf text-brand-ivory rounded-lg font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
