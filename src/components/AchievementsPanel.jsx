import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy, BookOpen, Award, FileText, Plus, Search, Filter, 
  Download, Calendar, Trash2, Loader2, AlertTriangle, X, Check, Eye, Bell
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import {
  isPushSupported,
  getPermissionState,
  getActiveSubscription,
  subscribeUser,
  unsubscribeUser,
  resetPushService
} from '../services/pushNotification';

// Helper for type badges
const TYPE_DETAILS = {
  journal: { label: 'Journal', icon: BookOpen, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  publication: { label: 'Publication', icon: BookOpen, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  award: { label: 'Award', icon: Award, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  certification: { label: 'Certification', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  achievement: { label: 'Achievement', icon: Trophy, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AchievementsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isMyOnly, setIsMyOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Push notifications state
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  // Check current browser subscription status on mount
  useEffect(() => {
    async function checkPushState() {
      if (isPushSupported()) {
        const perm = getPermissionState();
        setPermissionState(perm);
        const sub = await getActiveSubscription();
        setIsPushEnabled(!!sub);
      }
    }
    checkPushState();
  }, []);

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    setPushError('');
    try {
      if (isPushEnabled) {
        await unsubscribeUser();
        setIsPushEnabled(false);
        setPermissionState(getPermissionState());
      } else {
        await subscribeUser();
        setIsPushEnabled(true);
        setPermissionState('granted');
      }
    } catch (err) {
      console.error('[Push Setup Error]:', err);
      setPushError(err.message || 'Failed to update push subscription.');
      // Fallback state synchronization
      if (isPushSupported()) {
        setPermissionState(getPermissionState());
        const sub = await getActiveSubscription();
        setIsPushEnabled(!!sub);
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const renderPushBanner = () => {
    if (!isPushSupported()) return null;

    const isDenied = permissionState === 'denied';

    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
        {/* Decorative background glow */}
        <div className="absolute -left-10 -top-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3.5 relative z-10">
          <div className={`p-2.5 rounded-xl ${isPushEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'} shrink-0`}>
            {isPushEnabled ? (
              <Check className="w-5 h-5 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              {isPushEnabled ? 'Native Device Notifications Active' : 'Get Real-Time OS Notifications'}
              {isPushEnabled && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                  Live
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              {isPushEnabled
                ? 'Excellent! You will now receive native, system-level background push notification banners when achievements or publications are shared, even if the app is closed.'
                : isDenied
                ? 'Browser notification permission is currently blocked. Please reset your browser site permissions to enable background push notifications.'
                : 'Stay motivated and stay connected! Enable native background push notifications to instantly see when staff or students publish journals, log achievements, or win awards.'}
            </p>
            {pushError && (
              <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 shrink-0">
                  <AlertTriangle size={12} />
                  {pushError}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Stuck? This will unregister and purge all active service workers on this domain and reload the page. Continue?")) {
                      await resetPushService();
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-primary hover:underline font-extrabold self-start sm:self-auto cursor-pointer"
                >
                  (Click here to Reset & Retry)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-3 relative z-10 self-end md:self-center">
          {isDenied ? (
            <span className="text-xs font-bold text-rose-500/80 bg-rose-500/5 border border-rose-500/10 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Blocked in Browser
            </span>
          ) : (
            <button
              onClick={handleTogglePush}
              disabled={isPushLoading}
              className={`flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                isPushEnabled
                  ? 'bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 border border-border/60'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-sm'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isPushLoading ? (
                <>
                  <Loader2 className="animate-spin w-3.5 h-3.5" />
                  Updating...
                </>
              ) : isPushEnabled ? (
                'Disable Device Notifications'
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  Enable Push Notifications
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Add Achievement form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [achievementType, setAchievementType] = useState('achievement');
  const [dateAchieved, setDateAchieved] = useState('');
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all achievements
  const { data: feed = [], isLoading, error } = useQuery({
    queryKey: ['achievements-feed'],
    queryFn: () => api.get('achievements'),
  });

  // Create Achievement mutation
  const createMutation = useMutation({
    mutationFn: (formData) => {
      return api.post('achievements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['achievements-feed']);
      setShowAddModal(false);
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit achievement.');
    },
  });

  // Delete Achievement mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`achievements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['achievements-feed']);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAchievementType('achievement');
    setDateAchieved('');
    setFile(null);
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title) {
      setErrorMsg('Title is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('achievement_type', achievementType);
    if (dateAchieved) formData.append('date_achieved_str', dateAchieved);
    if (file) formData.append('file', file);

    createMutation.mutate(formData);
  };

  // Filter & Search
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
        item.user_name.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === 'all' || item.achievement_type === filterType;
      const matchUser = !isMyOnly || item.user_id === user?.id;

      return matchSearch && matchType && matchUser;
    });
  }, [feed, search, filterType, isMyOnly, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Motivation & Achievements</h2>
          <p className="text-muted-foreground mt-1">
            Browse publications, awards, and journals. Log your milestones to inspire the campus!
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-md shrink-0 hover:scale-[1.02]"
        >
          <Plus size={16} />
          Share Achievement
        </button>
      </div>

      {/* Background Push Notifications Banner */}
      {renderPushBanner()}

      {/* Controls panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-border/40 shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title, description, or achiever..."
            className="input-field w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Type selector */}
        <div>
          <select
            className="input-field w-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="journal">Journals & Papers</option>
            <option value="award">Awards & Honors</option>
            <option value="certification">Certifications</option>
            <option value="achievement">General Achievements</option>
          </select>
        </div>
        {/* Owner toggle */}
        <button
          onClick={() => setIsMyOnly((prev) => !prev)}
          className={`py-2 px-4 rounded-xl border font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            isMyOnly
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border/60 text-muted-foreground hover:bg-muted/30'
          }`}
        >
          <Filter size={14} />
          {isMyOnly ? 'My Achievements Only' : 'Everyone\'s Achievements'}
        </button>
      </div>

      {/* Celebration Feed */}
      {filteredFeed.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-full bg-muted/40">
            <Trophy size={36} className="text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No achievements found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Be the first to share an achievement, journal, or paper for this search criteria!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFeed.map((item) => {
            const details = TYPE_DETAILS[item.achievement_type] || TYPE_DETAILS.achievement;
            const Icon = details.icon;
            const isOwner = item.user_id === user?.id;

            return (
              <div
                key={item.id}
                className="panel flex flex-col p-5 border border-border/40 hover:border-primary/20 hover:shadow-md transition-all duration-300 group hover:scale-[1.005] bg-card"
              >
                {/* Creator Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* User profile pic */}
                    {item.user_profile_photo ? (
                      <img
                        src={`${api.defaults.baseURL.replace(/\/$/, '')}${item.user_profile_photo}`}
                        alt={item.user_name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-sm">
                        {item.user_name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground leading-tight">{item.user_name}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-0.5">
                        {item.user_role}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border flex items-center gap-1 ${details.color}`}>
                    <Icon size={10} />
                    {details.label}
                  </span>
                </div>

                {/* Achievement Body */}
                <div className="mt-4 flex-1">
                  <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 whitespace-pre-line break-words">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={13} />
                    {item.date_achieved ? formatDisplayDate(item.date_achieved) : 'N/A'}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.attachment_url && (
                      <a
                        href={`${api.defaults.baseURL.replace(/\/$/, '')}${item.attachment_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                      >
                        <Eye size={12} />
                        View Proof
                      </a>
                    )}

                    {(isOwner || user?.role_name?.lower() === 'admin') && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this achievement?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Delete achievement"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <div>
                <h3 className="font-bold text-foreground text-lg">Share Achievement</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Let your success inspire the institutional network!</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 font-medium">
                  <AlertTriangle size={14} className="shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title / Milestone</label>
                <input
                  type="text"
                  placeholder="e.g., Published research on Large Language Models in IEEE"
                  className="input-field w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                  <select
                    className="input-field w-full"
                    value={achievementType}
                    onChange={(e) => setAchievementType(e.target.value)}
                  >
                    <option value="achievement">General Achievement</option>
                    <option value="journal">Journal Paper</option>
                    <option value="award">Honor or Award</option>
                    <option value="certification">Certification</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date Achieved</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={dateAchieved}
                    onChange={(e) => setDateAchieved(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description / Notes</label>
                <textarea
                  placeholder="Tell us more about this milestone (co-authors, impact, scope, etc.)"
                  className="input-field w-full min-h-[100px] py-2 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                  Add Attachment (PDF or Image)
                </label>
                <div className="flex items-center gap-3">
                  <label className="py-2 px-4 rounded-xl border border-dashed border-border/80 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all text-xs font-semibold cursor-pointer select-none">
                    Select File
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground truncate max-w-xs">
                    {file ? file.name : 'No file selected (Max 10MB)'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trophy size={16} />
                  )}
                  Share with Everyone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
