'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>

              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Go Back
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-black/50 rounded-lg text-xs text-red-300 overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
