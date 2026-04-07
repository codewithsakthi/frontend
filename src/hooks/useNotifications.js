import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

/**
 * Universal real-time notification hook.
 * Connects to the correct WebSocket channel based on user role:
 *   - admin  →  ws/admin/{user_id}
 *   - staff  →  ws/staff/{user_id}
 *   - student → ws/attendance/{roll_no}  (existing channel)
 *
 * Returns:
 *   - notifications[]  — list of notification objects (capped at 50)
 *   - unreadCount      — number of unread notifications
 *   - isConnected      — WebSocket status
 *   - markAllRead()    — clears unread count
 *   - clearAll()       — empties notification list
 */

const MAX_NOTIFICATIONS = 50;

// Keys to invalidate per notification type (React Query cache busting)
const INVALIDATION_MAP = {
  attendance_marked: ['staff-today-summary', 'admin-command-center', 'admin-attendance'],
  attendance_update: ['attendance'],
  submission_confirmed: ['staff-today-summary'],
  announcement: [],
};

export const useNotifications = () => {
  const queryClient = useQueryClient();
  
  // Use primitive selectors to prevent unnecessary re-renders/effect triggers
  const userId = useAuthStore(state => state.user?.id);
  const userRole = useAuthStore(state => state.user?.role_name || state.user?.role?.name || state.user?.role);
  const rollNo = useAuthStore(state => state.user?.roll_no || state.user?.username);
  const token = useAuthStore(state => state.token);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef(null);
  const currentUrl = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RETRIES = 8;

  // Stable message handler to avoid dependency in connect
  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data?.type) return;

      const notif = {
        id: `${Date.now()}-${Math.random()}`,
        type: data.type,
        title: data.title || data.type,
        message: data.message || '',
        meta: data.meta || {},
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount(prev => prev + 1);

      const keys = INVALIDATION_MAP[data.type] || [];
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    } catch (err) { /* ignore */ }
  }, [queryClient]);

  const connect = useCallback((url) => {
    if (!url) return;

    // Don't reconnect if already connected to this URL
    if (ws.current?.readyState === WebSocket.OPEN && currentUrl.current === url) {
      return;
    }

    // Close any dead/cleanup connection
    if (ws.current) {
      ws.current.close();
    }

    try {
      console.log(`📡 Connecting to Notification WS: ${url}`);
      ws.current = new WebSocket(url);
      currentUrl.current = url;

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = onMessage;

      ws.current.onerror = () => setIsConnected(false);

      ws.current.onclose = () => {
        setIsConnected(false);
        // Only auto-reconnect if it wasn't a manual close (where we'd clear currentUrl)
        if (currentUrl.current === url && reconnectAttempts.current < MAX_RETRIES) {
          const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => connect(url), delay);
        }
      };
    } catch (err) {
      console.error('WS Error:', err);
    }
  }, [onMessage]);

  useEffect(() => {
    if (!userId || !token) {
      // Cleanup if logged out
      if (ws.current) ws.current.close();
      currentUrl.current = null;
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const base = `${protocol}//${host}/api/v1/ws`;
    
    let url = null;
    if (userRole === 'admin') url = `${base}/admin/${userId}`;
    else if (userRole === 'staff') url = `${base}/staff/${userId}`;
    else if (userRole === 'student') url = `${base}/attendance/${rollNo}`;

    if (url && url !== currentUrl.current) {
      connect(url);
    }

    return () => {
      // No-op on re-renders, cleanup only handled by logout logic above or true unmount
    };
  }, [userId, userRole, rollNo, token, connect]);

  // Keep-alive ping every 30s
  useEffect(() => {
    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send('ping');
      }
    }, 30000);
    return () => clearInterval(ping);
  }, []);



  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, isConnected, markAllRead, clearAll };
};
