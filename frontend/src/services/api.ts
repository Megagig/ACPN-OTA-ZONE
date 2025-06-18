import axios from 'axios';

// Using relative URL for the API to work with Vite's proxy
// const API_URL = '/api';
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Adding timeout and better error handling
  timeout: 15000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (let the browser set it with boundary)
    if (config.data instanceof FormData) {
      // Remove the Content-Type header so that the browser can set it with proper boundary
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Log API responses for debugging
    if (response.config.url?.includes('/communications')) {
      console.log(
        `API Response [${response.config.method}] ${response.config.url}:`,
        response.data
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Network or connection error handling
    if (!error.response) {
      console.error('Network Error: Could not connect to the server');
      // You can add custom handling for network errors here
      return Promise.reject({
        ...error,
        message:
          'Network Error: Could not connect to the server. Please check your connection and try again.',
      });
    }

    // Handle 401 Unauthorized errors with token refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Retry the original request with new token
          originalRequest.headers[
            'Authorization'
          ] = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, log user out
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
