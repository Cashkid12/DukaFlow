import React from 'react';

export const Switch = ({ label, checked, onChange, description }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        {label && <p className="text-sm font-medium text-neutral-900">{label}</p>}
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-neutral-300'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
