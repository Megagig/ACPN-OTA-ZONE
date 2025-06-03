// Utility functions for API retries and error handling
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import apiClient from './apiClient';

/**
 * Retry a failed API request with exponential backoff
 * @param apiCall - The API call function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay before first retry in ms (default: 1000)
 * @returns The API response or throws the error after all retries
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<AxiosResponse<T>> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Don't retry for certain status codes (auth issues, not found, etc.)
      if (error.response) {
        // These status codes don't warrant retries
        const noRetryStatusCodes = [401, 403, 404, 422];
        if (noRetryStatusCodes.includes(error.response.status)) {
          throw error;
        }
      }

      // If we've reached the max retries, throw the error
      if (retries === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
      const delay = initialDelay * Math.pow(2, retries);

      // Log the retry attempt
      console.log(
        `API call failed, retrying in ${delay}ms (${retries + 1}/${maxRetries})`
      );

      // Wait for the delay period
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increment retry counter
      retries++;
    }
  }

  // This should never be reached, but TypeScript requires a return
  throw lastError;
}

/**
 * Makes an API GET request with retry functionality
 */
export async function getWithRetry<T>(
  url: string,
  config?: object
): Promise<T> {
  // Add a default timeout if none was specified
  const configWithDefaults = {
    timeout: 30000, // 30 seconds default timeout
    ...config,
  };

  try {
    const response = await retryApiCall(() =>
      apiClient.get<T>(url, configWithDefaults)
    );
    return response.data;
  } catch (error) {
    console.error(`Failed getWithRetry for ${url}:`, error);
    throw error;
  }
}

/**
 * Makes an API POST request with retry functionality
 */
export async function postWithRetry<T>(
  url: string,
  data?: any,
  config?: object
): Promise<T> {
  const response = await retryApiCall(() =>
    apiClient.post<T>(url, data, config)
  );
  return response.data;
}

/**
 * Makes an API PUT request with retry functionality
 */
export async function putWithRetry<T>(
  url: string,
  data?: any,
  config?: object
): Promise<T> {
  const response = await retryApiCall(() =>
    apiClient.put<T>(url, data, config)
  );
  return response.data;
}

/**
 * Makes an API PATCH request with retry functionality
 */
export async function patchWithRetry<T>(
  url: string,
  data?: any,
  config?: object
): Promise<T> {
  const response = await retryApiCall(() =>
    apiClient.patch<T>(url, data, config)
  );
  return response.data;
}

/**
 * Makes an API DELETE request with retry functionality
 */
export async function deleteWithRetry<T>(
  url: string,
  config?: object
): Promise<T> {
  const response = await retryApiCall(() => apiClient.delete<T>(url, config));
  return response.data;
}
