import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const FORCED_HOSTING_ONLY_MODE = import.meta.env.VITE_HOSTING_ONLY_MODE === 'true';

const isFirebaseHostingDomain = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const host = window.location.hostname || '';
  return host.endsWith('.web.app') || host.endsWith('.firebaseapp.com');
};

export const isHostingOnlyMode =
  FORCED_HOSTING_ONLY_MODE ||
  (!import.meta.env.DEV && !import.meta.env.VITE_API_URL && isFirebaseHostingDomain());

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const isApiUnavailable = (error) => {
  if (error?.isDemoMode) {
    return true;
  }

  const status = error?.response?.status;
  const requestUrl = String(error?.config?.url || '');
  const baseURL = String(error?.config?.baseURL || '');
  const fullUrl = `${baseURL}${requestUrl}`;

  if (!error?.response) {
    return true;
  }

  return status === 404 && fullUrl.includes('/api/');
};

api.interceptors.request.use((config) => {
  if (isHostingOnlyMode) {
    return Promise.reject({
      isDemoMode: true,
      message: 'API disabled in hosting-only mode.',
      config,
    });
  }

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
