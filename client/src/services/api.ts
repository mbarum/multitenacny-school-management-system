import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
