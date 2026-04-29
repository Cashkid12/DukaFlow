import React from 'react';

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full h-11 px-4 bg-white border rounded-md text-base placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-subtle transition-all duration-200 ${
          error ? 'border-danger' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export const Select = ({ label, error, children, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full h-11 px-4 bg-white border rounded-md text-base text-neutral-700 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-subtle transition-all duration-200 appearance-none ${
          error ? 'border-danger' : 'border-neutral-300'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export const TextArea = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-white border rounded-md text-base placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-subtle transition-all duration-200 resize-vertical ${
          error ? 'border-danger' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export const SearchInput = ({ className = '', ...props }) => {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        className={`w-full h-11 pl-11 pr-4 bg-white border border-neutral-300 rounded-md text-base placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-subtle transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};
