/**
 * Generate a random 6-digit verification code
 * @returns string - 6-digit code
 */
export const generateVerificationCode = (): string => {
  // Generate a random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if a verification code is valid
 * @param code The code to validate
 * @returns boolean
 */
export const isValidVerificationCode = (code: string): boolean => {
  // Check if code is exactly 6 digits
  return /^\d{6}$/.test(code);
};
