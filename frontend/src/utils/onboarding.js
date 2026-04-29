/**
 * Onboarding Validation & Helper Utilities
 */

// Validate Kenyan phone number format
export const validateKenyanPhone = (phone) => {
  const kenyanPattern = /^(\+254|0)?[71]\d{8}$/;
  return kenyanPattern.test(phone.replace(/\s/g, ''));
};

// Format phone number to Kenyan format
export const formatKenyanPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.startsWith('254')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  } else if (digits.length > 0) {
    return `+254${digits}`;
  }
  return value;
};

// Generate slug from shop name
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Validate slug format
export const validateSlug = (slug) => {
  if (!slug || slug.length < 3 || slug.length > 20) return false;
  return /^[a-z0-9-]+$/.test(slug);
};

// Validate email format
export const validateEmail = (email) => {
  const emailPattern = /^\S+@\S+\.\S+$/;
  return emailPattern.test(email);
};

// Validate full name
export const validateFullName = (name) => {
  return name.trim().length >= 2;
};

// Check if step 1 is completed
export const isStep1Completed = () => {
  const data = localStorage.getItem('onboarding_step1');
  if (!data) return false;
  
  try {
    const parsed = JSON.parse(data);
    return parsed.fullName && parsed.phone && parsed.role;
  } catch {
    return false;
  }
};

// Check if step 2 is completed
export const isStep2Completed = () => {
  const data = localStorage.getItem('onboarding_step2');
  if (!data) return false;
  
  try {
    const parsed = JSON.parse(data);
    return parsed.shopName && parsed.subdomain && parsed.businessType;
  } catch {
    return false;
  }
};

// Check if onboarding is fully completed
export const isOnboardingCompleted = () => {
  return localStorage.getItem('onboarding_completed') === 'true';
};

// Get onboarding data
export const getOnboardingData = () => {
  return {
    step1: JSON.parse(localStorage.getItem('onboarding_step1') || '{}'),
    step2: JSON.parse(localStorage.getItem('onboarding_step2') || '{}'),
    completed: isOnboardingCompleted(),
    completedAt: localStorage.getItem('onboarding_completed_at'),
  };
};

// Clear onboarding data
export const clearOnboardingData = () => {
  localStorage.removeItem('onboarding_step1');
  localStorage.removeItem('onboarding_step2');
  localStorage.removeItem('onboarding_completed');
  localStorage.removeItem('onboarding_completed_at');
};

// Validate complete onboarding data before submission
export const validateOnboardingComplete = (data) => {
  const errors = {};

  // Step 1 validations
  if (!data.step1?.fullName || data.step1.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  if (!data.step1?.phone) {
    errors.phone = 'Phone number is required';
  } else if (!validateKenyanPhone(data.step1.phone)) {
    errors.phone = 'Enter a valid Kenyan phone number';
  }

  if (!data.step1?.role) {
    errors.role = 'Please select a role';
  }

  // Step 2 validations
  if (!data.step2?.shopName || data.step2.shopName.trim().length < 3) {
    errors.shopName = 'Shop name must be at least 3 characters';
  }

  if (!data.step2?.subdomain) {
    errors.subdomain = 'Web address is required';
  } else if (!validateSlug(data.step2.subdomain)) {
    errors.subdomain = 'Web address must be 3-20 characters (letters, numbers, hyphens only)';
  }

  if (!data.step2?.businessType) {
    errors.businessType = 'Please select a business type';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
