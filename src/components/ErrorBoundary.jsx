import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary - ${this.props.name || 'Component'}] caught:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white rounded-3xl border border-red-200 shadow-md max-w-xl mx-auto my-12 text-slate-800 space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <div className="p-2.5 bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {this.props.name || 'Module'} Encountered a Display Issue
              </h2>
              <p className="text-xs text-slate-500">
                A non-critical rendering error was intercepted safely.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl text-xs font-mono text-red-700 border border-slate-200 overflow-x-auto max-h-32">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={this.handleReload}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
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

