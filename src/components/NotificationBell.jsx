import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Trophy, X, Check, CheckCheck, Trash2, Wifi, WifiOff, Users, BookOpen, Megaphone, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import {
  isPushSupported,
  getPermissionState,
  getActiveSubscription,
  subscribeUser,
  unsubscribeUser
} from '../services/pushNotification';

const TYPE_CONFIG = {
  attendance_marked: {
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  attendance_update: {
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  submission_confirmed: {
    icon: Check,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  announcement: {
    icon: Megaphone,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  achievement: {
    icon: Trophy,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifCard({ notif }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.announcement;
  const Icon = cfg.icon;

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border} transition-all`}>
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-widest ${cfg.color} mb-0.5`}>
          {notif.title}
        </p>
        <p className="text-xs text-foreground leading-relaxed break-words">
          {notif.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.timestamp)}</p>
      </div>
      {!notif.read && (
        <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${cfg.color.replace('text-', 'bg-')}`} />
      )}
    </div>
  );
}

export default function NotificationBell({ className = '' }) {
  const { notifications, unreadCount, isConnected, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  // Native Push and OS Notifications States
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushError, setPushError] = useState('');

  // Check state on mount
  useEffect(() => {
    if (isPushSupported()) {
      setPushSupported(true);
      setPushPermission(getPermissionState());
      getActiveSubscription().then(sub => {
        setPushEnabled(!!sub);
      });
    }
  }, []);

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    setPushError('');
    try {
      if (pushEnabled) {
        await unsubscribeUser();
        setPushEnabled(false);
        setPushPermission(getPermissionState());
      } else {
        await subscribeUser();
        setPushEnabled(true);
        setPushPermission('granted');

        // Fire a successful system notification confirmation!
        if ('Notification' in window && Notification.permission === 'granted') {
          const welcomeTitle = "System Notifications Active!";
          const welcomeOptions = {
            body: "Excellent! You will now receive system-level native banners on this device.",
            icon: '/icons/android/launchericon-192x192.png',
            badge: '/icons/android/launchericon-192x192.png'
          };
          try {
            new Notification(welcomeTitle, welcomeOptions);
          } catch (e) {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(welcomeTitle, welcomeOptions);
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[Push Setup Bell Error]:', err);
      setPushError(err.message || 'Permission denied or failed.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !bellRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  };

  const hasNew = unreadCount > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button (User-Requested Style) */}
      <button
        ref={bellRef}
        onClick={handleOpen}
        aria-label={`${unreadCount} unread notifications`}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors group"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`lucide lucide-bell transition-transform duration-300 ${hasNew ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
        >
          <path d="M10.268 21a2 2 0 0 0 3.464 0" />
          <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        </svg>

        {/* Unread Dot (Rose) */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
        )}

        {/* Connection Status Indicator (Subtle) */}
        <span className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full border border-background shadow-sm ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-80 sm:w-96 bg-card backdrop-blur-2xl border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-black text-foreground">Live Notifications</span>
              <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-slate-500/10 text-slate-500'
              }`}>
                {isConnected
                  ? <><Wifi className="w-2.5 h-2.5" /> Live</>
                  : <><WifiOff className="w-2.5 h-2.5" /> Offline</>
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Premium Native Push CTA Banner */}
          {pushSupported && !pushEnabled && (
            <div className="bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent border-b border-border/60 p-3.5 flex flex-col gap-1.5 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between gap-3 z-10">
                <div className="min-w-0">
                  <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                    Get OS Notifications
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                    Receive native OS banners on Windows, iOS & Android even when offline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isSubscribing}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-1.5 px-3 rounded-lg shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubscribing ? 'Enabling...' : 'Enable'}
                </button>
              </div>
              {pushError && (
                <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 z-10">
                  <AlertTriangle size={10} />
                  {pushError}
                </p>
              )}
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Bell className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60">
                  {isConnected
                    ? 'Events will appear here in real-time'
                    : 'Connecting to live feed…'
                  }
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {notifications.map((n) => (
                  <NotifCard key={n.id} notif={n} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border/40 px-4 py-2 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · session only
              </p>
              <button
                onClick={clearAll}
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
