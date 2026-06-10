import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Shared error state for pages.
 * Shows a centered error message with a "Try Again" button.
 *
 * @param {string}  title   — Error heading
 * @param {string}  message — Optional description
 * @param {Function} onRetry — Called when user clicks "Try Again"
 * @param {string}  icon    — Optional lucide icon component name override (uses AlertCircle by default)
 */
const ErrorState = ({
  title = 'Unable to load data',
  message = 'Please check your connection and try again',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center min-h-[600px] px-4 animate-fade-in">
    <AlertCircle size={48} className="text-neutral-300 mb-4" />
    <h2 className="text-lg font-semibold text-neutral-900 mb-1">
      {title}
    </h2>
    {message && (
      <p className="text-sm text-neutral-500 mb-6 text-center max-w-sm">
        {message}
      </p>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-[#312E81] text-white font-medium rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm"
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
