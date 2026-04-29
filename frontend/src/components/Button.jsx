import React from 'react';

export const Button = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  icon: Icon,
  ...props 
}) => {
  const baseClasses = "font-medium transition-all duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-deep text-white py-3 px-6 rounded-md shadow-sm hover:shadow-md",
    secondary: "bg-white hover:bg-neutral-50 text-neutral-700 py-3 px-6 rounded-md border border-neutral-300 hover:border-primary",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-600 py-2 px-4 rounded-md",
    danger: "bg-white hover:bg-danger-bg text-danger py-3 px-6 rounded-md border border-danger hover:border-danger",
    accent: "bg-accent hover:bg-accent-deep text-white py-3 px-6 rounded-md shadow-sm hover:shadow-md",
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const IconButton = ({ icon: Icon, className = '', ...props }) => {
  return (
    <button 
      className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 transition-all duration-200 ${className}`}
      {...props}
    >
      <Icon size={20} />
    </button>
  );
};

export const FAB = ({ icon: Icon, className = '', ...props }) => {
  return (
    <button 
      className={`fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-deep text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 ${className}`}
      {...props}
    >
      <Icon size={24} />
    </button>
  );
};
