// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: always read fresh from localStorage (no caching issues)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // read every time — safe & reliable
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Optional: remove header if no token (cleaner)
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: response interceptor to handle 401 globally (logout on invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid/expired → logout
      localStorage.removeItem('token');
      window.location.href = '/login'; // or use navigate from react-router
      // You can also show toast: toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export default api;