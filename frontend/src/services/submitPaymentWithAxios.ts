/* eslint-disable */
// This is a standalone payment submission function for importing into the financial service
// It uses Axios with FormData directly instead of XMLHttpRequest for better reliability

import api from './api';
import type { Payment } from '../types/financial.types';

export async function submitPaymentWithAxios(data: FormData): Promise<Payment> {
  try {
    // Debug log the FormData contents
    console.log('Submitting payment with Axios and FormData:');
    let hasReceipt = false;

    for (const pair of data.entries()) {
      if (pair[0] === 'receipt') {
        hasReceipt = true;
        const file = pair[1] as File;
        console.log('FormData entry - receipt:', {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } else {
        console.log('FormData entry:', pair[0], pair[1]);
      }
    }

    // Validate that we have the receipt file
    if (!hasReceipt) {
      throw new Error('Receipt file is missing from form data');
    }

    // Create a clean FormData instance
    const cleanFormData = new FormData();

    // Copy all entries from the original FormData
    for (const [key, value] of data.entries()) {
      if (key === 'receipt' && value instanceof File) {
        // Add the file with the filename for proper handling
        // This is critical - we need to explicitly set the filename
        cleanFormData.append('receipt', value, value.name);
        console.log(
          `Adding file to clean FormData: ${value.name} (${value.size} bytes, ${value.type})`
        );
      } else {
        cleanFormData.append(key, value as string);
        console.log(`Adding field to clean FormData: ${key}=${value}`);
      }
    }

    // Use axios directly - Axios will set the content-type header correctly for FormData
    console.log('Submitting with Axios to:', '/api/payments/submit');
    const response = await api.post('/api/payments/submit', cleanFormData, {
      headers: {
        // Don't set Content-Type manually, let Axios handle it
        // It needs to be multipart/form-data with the boundary parameter
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Increase timeouts for large file uploads
      timeout: 120000, // 2 minute timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Add progress tracking for better debugging
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });

    console.log('Upload successful:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Error submitting payment:', error);

    // Enhanced error logging with structured information
    if (error.response) {
      console.error(
        `Server responded with status ${error.response.status}:`,
        error.response.data
      );

      // Log the detailed validation errors if they exist
      if (error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }

      // If there's a stack trace, log it for debugging
      if (error.response.data && error.response.data.stack) {
        console.error('Server stack trace:', error.response.data.stack);
      }

      // Log headers for debugging CORS or content-type issues
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    // Handle specific error types with user-friendly messages

    // Check for network connectivity issues
    if (!navigator.onLine) {
      throw new Error(
        'Network connection lost. Please check your internet connection and try again.'
      );
    }

    // Check for file size limits (413 Payload Too Large)
    if (error.response?.status === 413) {
      console.error('DETECTED UPLOAD ISSUE: File too large');
      throw new Error(
        'The receipt file is too large. Please reduce the file size and try again.'
      );
    }

    // Check for server timeout (504 Gateway Timeout)
    if (error.response?.status === 504 || error.code === 'ECONNABORTED') {
      console.error('DETECTED UPLOAD ISSUE: Server timeout');
      throw new Error(
        'The upload timed out. Please try again with a smaller file or check your network connection.'
      );
    }

    // Check for specific "Unexpected end of form" error
    if (error.response?.data?.error?.includes('Unexpected end of')) {
      console.error('DETECTED UPLOAD ISSUE: Unexpected end of form data');
      throw new Error(
        'File upload failed. Please try a smaller file or a different format.'
      );
    }

    // Check for ActionType enum error
    if (
      error.response?.data?.error?.includes(
        'is not a valid enum value for path `action`'
      )
    ) {
      console.error('DETECTED ENUM ISSUE: Invalid ActionType value');
      throw new Error(
        'Internal system error with action types. Please contact support.'
      );
    }

    // Check for file type validation errors
    if (
      error.response?.data?.error?.includes('Invalid file type') ||
      error.response?.data?.message?.includes('Invalid file type')
    ) {
      console.error('DETECTED UPLOAD ISSUE: Invalid file type');
      throw new Error(
        'The receipt file type is not supported. Please upload a JPG, PNG, or PDF file.'
      );
    }

    // Check for authorization issues
    if (error.response?.status === 401) {
      console.error('DETECTED AUTH ISSUE: Unauthorized');
      throw new Error(
        'Your session may have expired. Please log in again and retry.'
      );
    }

    // Check for permission issues
    if (error.response?.status === 403) {
      console.error('DETECTED AUTH ISSUE: Forbidden');
      throw new Error(
        'You do not have permission to upload payment receipts. Please contact your administrator.'
      );
    }

    // Default error message for unhandled cases
    if (error.response?.status) {
      throw new Error(
        `Server error (${error.response.status}): ${
          error.response.data?.message || 'Unknown error occurred'
        }`
      );
    }

    // If we've reached this point, it's an unexpected error
    throw new Error(
      `Error uploading payment: ${error.message || 'Unknown error occurred'}`
    );
  }
}

export default submitPaymentWithAxios;
