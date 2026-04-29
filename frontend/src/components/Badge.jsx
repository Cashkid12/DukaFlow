import React from 'react';

export const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
    info: 'bg-info-bg text-info',
    premium: 'bg-accent-light text-accent-deep',
    mpesa: 'bg-mpesa text-white',
    primary: 'bg-primary-subtle text-primary',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
