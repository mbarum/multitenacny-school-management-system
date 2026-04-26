import axios from 'axios';
import storage from './storage';

const api = axios.create({
  // We handle prefixing in the interceptor to be more robust against leading slashes in calls
});

api.interceptors.request.use((config) => {
  const token = storage.getItem('token');
  
  if (config.url && !config.url.startsWith('http')) {
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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 402) {
      // Subscription is inactive or past due
      // Redirect to a billing or subscription page
      if (window.location.pathname !== '/pricing') {
        window.location.href = '/pricing?locked=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
