// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Phone validation (Kenyan format)
export const validatePhone = (phone) => {
  const re = /^(\+254|0)?[71]\d{8}$/;
  return re.test(phone.replace(/\s/g, ''));
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'strong'
      : password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) ? 'medium'
      : password.length >= 6 ? 'weak' : 'very-weak'
  };
};

// Validate required field
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return '';
};

// Validate number range
export const validateNumberRange = (value, min = 0, max = Infinity, fieldName = 'Value') => {
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return '';
};

// Validate URL
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate subdomain
export const validateSubdomain = (subdomain) => {
  const re = /^[a-z0-9-]+$/;
  if (!subdomain || subdomain.length < 3) {
    return 'Subdomain must be at least 3 characters';
  }
  if (!re.test(subdomain)) {
    return 'Subdomain can only contain lowercase letters, numbers, and hyphens';
  }
  return '';
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  for (const [field, value] of Object.entries(formData)) {
    if (rules[field]) {
      const error = rules[field](value);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
