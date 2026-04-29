import React from 'react';

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, accentColor = 'accent' }) => {
  const borderColors = {
    accent: 'border-accent',
    success: 'border-success',
    warning: 'border-warning',
    danger: 'border-danger',
    info: 'border-info',
    primary: 'border-primary',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md p-5 border-l-4 ${borderColors[accentColor]} transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 number-font">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-neutral-500'}`}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center">
            <Icon size={24} className="text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductCard = ({ image, name, price, stock, category, onClick }) => {
  const stockStatus = stock === 0 ? 'out' : stock < 10 ? 'low' : 'in';
  const stockLabels = { out: 'Out of Stock', low: 'Low Stock', in: 'In Stock' };
  const stockColors = { out: 'bg-danger-bg text-danger', low: 'bg-warning-bg text-warning', in: 'bg-success-bg text-success' };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      {image && (
        <div className="h-48 bg-neutral-100 flex items-center justify-center">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-base font-semibold text-neutral-900 truncate flex-1">{name}</h4>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stockColors[stockStatus]}`}>
            {stockLabels[stockStatus]}
          </span>
        </div>
        {category && <p className="text-sm text-neutral-500 mb-2">{category}</p>}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-accent number-font">KSh {price.toLocaleString()}</p>
          <p className="text-sm text-neutral-600">Qty: {stock}</p>
        </div>
      </div>
    </div>
  );
};

export const AlertCard = ({ type = 'warning', icon: Icon, title, message, action }) => {
  const typeStyles = {
    warning: 'bg-warning-bg border-l-4 border-warning',
    danger: 'bg-danger-bg border-l-4 border-danger',
    success: 'bg-success-bg border-l-4 border-success',
    info: 'bg-info-bg border-l-4 border-info',
  };

  const iconColors = {
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
    info: 'text-info',
  };

  return (
    <div className={`${typeStyles[type]} rounded-md p-4 flex items-start gap-3`}>
      {Icon && <Icon size={20} className={iconColors[type]} />}
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold text-neutral-900 mb-1">{title}</h4>}
        <p className="text-sm text-neutral-700">{message}</p>
        {action}
      </div>
    </div>
  );
};
