// src/utils/validation.ts

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format.';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required.';
  // Simple Kenyan phone number regex (starts with 07, 01, or 254/+)
  if (!/^(?:254|\+254|0)?(7|1)\d{8}$/.test(phone)) return 'Invalid Kenyan phone number format.';
  return null;
};

export const validateRequired = (value: string | number | undefined | null): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 'This field is required.';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
    if (password && password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    return null;
};

export const validateAmount = (amount: number | string): string | null => {
    if (validateRequired(amount) !== null) return 'Amount is required.';
    if (isNaN(Number(amount)) || Number(amount) <= 0) return 'Amount must be a number greater than 0.';
    return null;
};