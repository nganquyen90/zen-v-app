import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private parseFirestoreError(errorMsg: string) {
    try {
      return JSON.parse(errorMsg);
    } catch {
      return null;
    }
  }

  public render() {
    if (this.state.hasError) {
      const firestoreError = this.state.error ? this.parseFirestoreError(this.state.error.message) : null;

      return (
        <div className="flex flex-col items-center justify-center h-screen bg-sage-50 p-6 text-center font-sans">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
          
          {firestoreError ? (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 text-left w-full max-w-md mb-6">
              <p className="text-red-600 font-medium mb-2 text-sm">Permission Denied</p>
              <p className="text-slate-600 text-sm mb-4">
                Your account doesn't have permission to perform this action. Please check your Firestore Security Rules.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-500 break-all">
                <p><strong>Operation:</strong> {firestoreError.operationType}</p>
                <p><strong>Path:</strong> {firestoreError.path}</p>
                <p><strong>Error:</strong> {firestoreError.error}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 mb-6 max-w-md">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 transition-colors"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
