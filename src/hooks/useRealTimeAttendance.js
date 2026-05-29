import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../api/client';

/**
 * Hook to manage real-time attendance updates via WebSocket
 * Listens for attendance changes and invalidates React Query cache
 */
export const useRealTimeAttendance = (rollNo, enabled = true) => {
  const queryClient = useQueryClient();
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !rollNo) return;

    // Determine WebSocket URL
    let wsBase = '';
    if (API_BASE) {
      wsBase = API_BASE.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBase = `${protocol}//${window.location.host}`;
    }
    const wsUrl = `${wsBase}/api/v1/ws/attendance/${rollNo}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('📡 Real-time attendance connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Attendance update received:', data);

          // Invalidate attendance queries to trigger refetch
          queryClient.invalidateQueries({
            queryKey: ['attendance', rollNo],
          });

          // Show toast notification
          if (data.message) {
            console.log('✨ ' + data.message);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('🔌 Real-time attendance disconnected');
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current += 1;
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }, [rollNo, enabled, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
};
