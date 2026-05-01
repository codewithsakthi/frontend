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

// ─── Refresh lock to prevent concurrent token rotation ────────────────────────
// When multiple requests fail with 401 simultaneously, only ONE should call
// /auth/refresh. The rest queue up and reuse the same new token once it arrives.
let isRefreshing = false;
let refreshQueue = []; // [{ resolve, reject }]

function processRefreshQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Track last activity time on every successful response
    useAuthStore.getState().updateLastActivity();
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, lastActivity } = useAuthStore.getState();

      // Check if the user has been inactive for more than 7 days.
      // If so, log them out instead of attempting a silent refresh.
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (lastActivity && Date.now() - lastActivity > SEVEN_DAYS_MS) {
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired due to inactivity'));
      }

      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // ── If a refresh is already in-flight, queue this request ───────────
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }
      // ─────────────────────────────────────────────────────────────────────

      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
          refresh_token: refreshToken
        });

        // IMPORTANT: Save BOTH the new access token AND the new refresh token.
        // The backend rotates the refresh token on every use (revokes old, issues new).
        // If we discard the new refresh token here, the next silent refresh will
        // fail with "Refresh token expired or revoked" → immediate logout.
        const { access_token, refresh_token: newRefreshToken } = response.data;

        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          access_token,
          newRefreshToken || refreshToken  // prefer new rotated token
        );

        // Resolve all queued requests with the new token
        processRefreshQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Reject all queued requests and force logout
        processRefreshQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
