export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const SOCKET_URL =
  API_URL.replace('/api', '');