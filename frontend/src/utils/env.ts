/**
 * Utility functions for safely accessing environment variables
 */

export const getEnvVar = (key: keyof ImportMetaEnv, fallback: string = ''): string => {
  try {
    return import.meta.env?.[key] || fallback;
  } catch (error) {
    console.warn(`Environment variable ${key} not found, using fallback: ${fallback}`);
    return fallback;
  }
};

export const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV || false;
  } catch (error) {
    return false;
  }
};

export const isProd = (): boolean => {
  try {
    return import.meta.env?.PROD || false;
  } catch (error) {
    return true; // Default to production if uncertain
  }
};

// Common environment variables
export const API_URL = getEnvVar('VITE_API_URL', 'https://acpn-ota-zone.onrender.com/api');
export const SOCKET_URL = getEnvVar('VITE_SOCKET_URL', 'https://acpn-ota-zone.onrender.com');
