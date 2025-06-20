/**
 * Utility functions for safely accessing environment variables
 */

export const getEnvVar = (key: keyof ImportMetaEnv, fallback: string = ''): string => {
  try {
    const value = import.meta.env?.[key];
    return typeof value === 'string' ? value : fallback;
  } catch (error) {
    console.warn(`Environment variable ${key} not found, using fallback: ${fallback}`);
    return fallback;
  }
};

export const isDev = (): boolean => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch (error) {
    return false;
  }
};

export const isProd = (): boolean => {
  try {
    return Boolean(import.meta.env?.PROD);
  } catch (error) {
    return true; // Default to production if uncertain
  }
};

// Common environment variables
export const API_URL = getEnvVar('VITE_API_URL', 'https://acpn-ota-zone.onrender.com');
export const SOCKET_URL = getEnvVar('VITE_SOCKET_URL', 'https://acpn-ota-zone.onrender.com');
