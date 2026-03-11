import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kioskToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getImageUrl = (path) => {
  if (!path) {
    return 'https://placehold.co/400x300/e2e8f0/334155?text=No+Image';
  }

  const clean = path.replace(/\\/g, '/');
  if (clean.startsWith('http')) {
    return clean;
  }

  return `${API_BASE_URL.replace('/api', '')}/${clean}`;
};

export default api;
