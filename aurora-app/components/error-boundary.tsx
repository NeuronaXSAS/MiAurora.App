'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#1E1535] to-[#231E35] flex items-center justify-center p-4 safe-area-inset">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center">
            {/* Aurora Logo */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-0.5">
              <div className="w-full h-full rounded-[14px] bg-[var(--color-aurora-violet)] flex items-center justify-center">
                <img src="/Au_Logo_1.png" alt="Aurora App" className="w-10 h-10 object-contain" />
              </div>
            </div>
            
            {/* Error Icon */}
            <div className="w-14 h-14 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[var(--color-aurora-salmon)]" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-white/70 mb-6 text-sm sm:text-base">
              Don't worry, your data is safe. Let's get you back on track.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full min-h-[52px] bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="flex-1 min-h-[48px] bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                >
                  Go Back
                </Button>
                
                <Link href="/feed" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full min-h-[48px] bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Emergency Access - Always available */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-white/50 mb-3">Safety features always available</p>
              <Link href="/emergency">
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] bg-[var(--color-aurora-orange)]/20 border-[var(--color-aurora-orange)]/40 text-white hover:bg-[var(--color-aurora-orange)]/30 rounded-xl"
                >
                  <Shield className="w-4 h-4 mr-2 text-[var(--color-aurora-orange)]" />
                  Emergency Access
                </Button>
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-white/50 cursor-pointer hover:text-white/80">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-black/50 rounded-xl text-xs text-[var(--color-aurora-salmon)] overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <p className="text-white/40 text-xs mt-6 flex items-center justify-center gap-1">
              Aurora App keeps you safe <Heart className="w-3 h-3 text-[var(--color-aurora-pink)]" />
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
