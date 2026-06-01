import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, User, GraduationCap, ShieldCheck, Sparkles, Bell, AlertTriangle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import api from '../api/client';
import { mapAuthToken, mapCurrentUser } from '../api/mappers';
import {
  isPushSupported,
  getPermissionState,
  getSubscriptionLocal,
  syncPendingSubscription
} from '../services/pushNotification';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Push Notification Prompt states
  const [showBanner, setShowBanner] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');

  useEffect(() => {
    // Show banner if push notifications are supported and permission has not been requested/granted yet
    if (isPushSupported() && getPermissionState() === 'default') {
      setShowBanner(true);
    }
  }, []);

  const handleEnableNotification = async () => {
    setNotifLoading(true);
    setNotifError('');
    try {
      await getSubscriptionLocal();
      setShowBanner(false);
      // Success triggers immediate browser welcome notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = "System Notifications Ready!";
        const options = {
          body: "Awesome! You will now receive system-level notifications when you access your dashboard.",
          icon: '/icons/android/launchericon-192x192.png'
        };
        try {
          new Notification(title, options);
        } catch (e) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            });
          }
        }
      }
    } catch (err) {
      console.error('[Landing Notif Error]:', err);
      setNotifError(err.message || 'Permission request failed.');
    } finally {
      setNotifLoading(false);
    }
  };

  const usernameError = useMemo(() => {
    if (!username.trim()) return 'Roll number / Identifer is required.';
    if (username.trim().length < 3) return 'Invalid identifier length.';
    return '';
  }, [username]);

  const passwordError = useMemo(() => {
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }, [password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const nextErrors = {
      username: usernameError,
      password: passwordError,
    };
    setFieldErrors(nextErrors);

    if (nextErrors.username || nextErrors.password) return;

    setLoading(true);
    setError('');
    try {
      const tokenPayload = await api.post('auth/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).then(mapAuthToken);

      const userData = await api.get('auth/me', {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` }
      }).then(mapCurrentUser);
      
      const role = userData.role?.name || userData.role;
      
      if (role === 'student' && /^\d{8}$/.test(password)) {
        localStorage.setItem('syncDob', password);
      }
      
      setAuth(userData, tokenPayload.access_token, tokenPayload.refresh_token);

      // Sync offline notification subscription if exists
      await syncPendingSubscription();

      // Send people to the right workspace by role
      const roleLower = role?.toLowerCase();
      if (roleLower === 'admin') {
        navigate('/admin');
      } else if (['staff', 'faculty', 'hod', 'director'].includes(roleLower)) {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-6 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md perspective-1000">
        <div className="relative animate-in zoom-in-95 duration-700">
          {/* Header/Logo */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 group cursor-pointer hover:rotate-6 transition-transform">
              <GraduationCap size={32} />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles size={12} /> Academic Intelligence
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">SPARK <span className="text-primary">Portal</span></h1>
            <p className="text-muted-foreground font-medium text-sm">Sign in to your high-speed academic command center.</p>
          </div>

          {/* System Notification Permission Banner */}
          {showBanner && (
            <div className="mb-6 relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-violet-500/10 to-transparent p-5 backdrop-blur-md flex flex-col gap-3.5 transition-all duration-300 shadow-lg animate-in slide-in-from-top-4 duration-500">
              <div className="absolute -left-10 -top-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    Enable System Notifications
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                      NEW
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    Receive native background system banners on Windows, iOS, and Android for real-time announcements, grades, and attendance updates!
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBanner(false)}
                  className="text-xs font-black text-muted-foreground hover:text-foreground uppercase tracking-widest px-3 py-2 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleEnableNotification}
                  disabled={notifLoading}
                  className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-black text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-md rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {notifLoading ? (
                    <>
                      <Loader2 className="animate-spin w-3.5 h-3.5" />
                      Activating...
                    </>
                  ) : (
                    'Activate OS Banners'
                  )}
                </button>
              </div>
              {notifError && (
                <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1 z-10">
                  <AlertTriangle size={12} />
                  {notifError}
                </div>
              )}
            </div>
          )}

          <div className="bento-card relative z-10 backdrop-blur-2xl bg-card/70 border-white/10 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Access</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all font-medium"
                    placeholder="258312 / Roll Number"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFieldErrors(p => ({ ...p, username: '' }));
                    }}
                    required
                  />
                </div>
                {fieldErrors.username && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.username}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secure Key</label>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors(p => ({ ...p, password: '' }));
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.password}</p>}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {loading ? 'Verifying Identity...' : 'Access Workspace'}
              </button>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center animate-in shake duration-300">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Stable
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} className="scale-90" />
            </div>
          </div>

          <p className="text-center mt-10 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            © 2026 Academic Intelligence Portal • Secured by Industry Standard AES-256
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
