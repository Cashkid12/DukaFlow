import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component for partial failures
 * Allows individual component retry without blocking entire dashboard
 */
export const ComponentError = ({ 
  error, 
  onRetry, 
  message = 'Failed to load this section',
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl border border-red-200 p-6 ${className}`}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle size={32} className="text-red-500 mb-3" />
        <p className="text-sm font-medium text-neutral-900 mb-1">{message}</p>
        <p className="text-xs text-neutral-500 mb-4">{error?.message || 'An error occurred'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-[#312E81] text-white text-sm font-medium rounded-lg hover:bg-[#1E1B4B] transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error Boundary Class Component
 * Catches JavaScript errors in child components
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ComponentError 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
