import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : '');

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});
// No auth headers — open access
