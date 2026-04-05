import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const FALLBACK_URL = 'https://spark-backend-n5s2.onrender.com';

let API_BASE = VITE_API_URL || '';

// In local development, if VITE_API_URL is missing, point directly to local backend on port 8001
if (!API_BASE && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  API_BASE = 'http://localhost:8001';
} else if (!API_BASE) {
  API_BASE = FALLBACK_URL;
}

// Ensure API_BASE has a protocol if it's an absolute URL
if (API_BASE && !API_BASE.startsWith('http')) {
  API_BASE = `https://${API_BASE}`;
}

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api/v1` : '/api/v1',
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          const { access_token } = response.data;

          useAuthStore.getState().setAuth(
            useAuthStore.getState().user,
            access_token,
            refreshToken
          );

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
