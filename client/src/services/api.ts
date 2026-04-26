import axios from 'axios';
import storage from './storage';

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = storage.getItem('token');
  
  if (config.url && !config.url.startsWith('http')) {
    // Ensure we always have an /api prefix for local routes, but don't double it
    let cleanPath = config.url;
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
    
    if (!cleanPath.startsWith('api/')) {
      cleanPath = `api/${cleanPath}`;
    }
    config.url = `/${cleanPath}`;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log outgoing requests for easier debugging in the environment logs
  console.log(`[AXIOS Request] ${config.method?.toUpperCase()} ${config.url}`);
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 402) {
      if (window.location.pathname !== '/pricing') {
        window.location.href = '/pricing?locked=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
