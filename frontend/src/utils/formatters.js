// Currency formatter for Kenyan Shillings
export const formatCurrency = (amount, currency = 'KES') => {
  if (currency === 'KES') {
    return `KSh ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Date formatter
export const formatDate = (date, format = 'relative') => {
  const d = new Date(date);
  const now = new Date();
  
  if (format === 'relative') {
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format number with commas
export const formatNumber = (num) => {
  return Number(num).toLocaleString('en-KE');
};

// Calculate percentage
export const calculatePercentage = (part, whole) => {
  if (!whole || whole === 0) return 0;
  return ((part / whole) * 100).toFixed(1);
};

// Calculate profit margin
export const calculateMargin = (costPrice, sellingPrice) => {
  if (!costPrice || !sellingPrice || sellingPrice === 0) return 0;
  return (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1);
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate SKU
export const generateSKU = (category, timestamp = Date.now()) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const suffix = timestamp.toString().slice(-6);
  return `${prefix}-${suffix}`;
};

// Generate receipt number
export const generateReceiptNumber = (shopName, date = new Date()) => {
  const prefix = shopName.substring(0, 3).toUpperCase();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${dateStr}-${random}`;
};
