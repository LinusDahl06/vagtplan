/**
 * Input Validation Utilities
 * Centralized validation functions for consistent input validation across the app
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, error: string|null}} - Validation result
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true, error: null };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, error: string|null}} - Validation result
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  return { valid: true, error: null };
};

/**
 * Validate name (person's name, workspace name, etc.)
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {{valid: boolean, error: string|null}} - Validation result
 */
export const validateName = (name, minLength = 1, maxLength = 100) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Name must be at least ${minLength} character${minLength > 1 ? 's' : ''}` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Name must be at most ${maxLength} characters` };
  }

  return { valid: true, error: null };
};

/**
 * Validate hours value
 * @param {number} hours - Hours to validate
 * @param {number} min - Minimum hours (default: 0)
 * @param {number} max - Maximum hours (default: 24)
 * @returns {{valid: boolean, error: string|null}} - Validation result
 */
export const validateHours = (hours, min = 0, max = 24) => {
  if (typeof hours !== 'number' || isNaN(hours)) {
    return { valid: false, error: 'Hours must be a valid number' };
  }

  if (hours <= min) {
    return { valid: false, error: `Hours must be greater than ${min}` };
  }

  if (hours > max) {
    return { valid: false, error: `Hours cannot exceed ${max}` };
  }

  return { valid: true, error: null };
};

/**
 * Sanitize text input (remove dangerous characters, trim whitespace)
 * @param {string} input - Text to sanitize
 * @param {number} maxLength - Maximum length to enforce
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') return '';

  // Remove any potential XSS characters
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validate color hex code
 * @param {string} color - Color hex code to validate
 * @returns {boolean} - True if valid hex color
 */
export const isValidHexColor = (color) => {
  if (!color || typeof color !== 'string') return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validate date string (YYYY-MM-DD format)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid date format
 */
export const isValidDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;

  // Check format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  // Check if it's a valid date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Validate time string (HH:MM format)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} - True if valid time format
 */
export const isValidTimeString = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return false;

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

/**
 * Validate role permissions object
 * @param {object} permissions - Permissions object to validate
 * @returns {boolean} - True if valid permissions object
 */
export const isValidPermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') return false;

  const validPermissions = [
    'manage_employees',
    'manage_roles',
    'manage_shifts',
    'manage_schedule'
  ];

  // Check that all keys are valid permission names
  const keys = Object.keys(permissions);
  return keys.every(key => validPermissions.includes(key) && typeof permissions[key] === 'boolean');
};

/**
 * Validate phone number (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if it has a reasonable number of digits (7-15)
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

/**
 * Validate array of items
 * @param {array} arr - Array to validate
 * @param {function} itemValidator - Optional validator function for each item
 * @returns {boolean} - True if valid array
 */
export const isValidArray = (arr, itemValidator = null) => {
  if (!Array.isArray(arr)) return false;

  if (itemValidator && typeof itemValidator === 'function') {
    return arr.every(item => itemValidator(item));
  }

  return true;
};

/**
 * Prevent XSS attacks by escaping HTML
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};
