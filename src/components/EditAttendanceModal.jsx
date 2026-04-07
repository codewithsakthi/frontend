import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X, CalendarDays, BookOpen, Clock, Users, CheckCircle2,
  AlertCircle, Loader2, Save, RotateCcw, Search, ChevronLeft,
  ChevronRight, History, Edit3, Check
} from 'lucide-react';
import api from '../api/client';

const STATUS_CONFIG = {
  P: { label: 'Present',  color: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  A: { label: 'Absent',   color: 'bg-rose-500',    ring: 'ring-rose-400',    text: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200' },
  O: { label: 'On Duty',  color: 'bg-amber-500',   ring: 'ring-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
};

const CYCLE = { P: 'A', A: 'O', O: 'P', null: 'P', undefined: 'P' };

function StudentCard({ student, status, onChange, search }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.P;
  const isUnmarked = !student.is_marked && status === null;

  const highlight = search
    ? (student.roll_no.toLowerCase().includes(search.toLowerCase()) ||
       student.name.toLowerCase().includes(search.toLowerCase()))
    : true;

  if (!highlight) return null;

  const displayStatus = status ?? 'P'; // Default P for display
  const displayCfg = STATUS_CONFIG[displayStatus];

  return (
    <button
      type="button"
      onClick={() => onChange(student.roll_no, CYCLE[status])}
      className={`relative group p-4 rounded-2xl border-2 flex flex-col items-start gap-1 transition-all duration-200 text-left w-full active:scale-95 ${displayCfg.bg}`}
    >
      {/* Status dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {isUnmarked && (
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 opacity-70">NEW</span>
        )}
        <span className={`w-2.5 h-2.5 rounded-full ${displayCfg.color}`} />
      </div>

      <span className={`text-[10px] font-black uppercase tracking-tight ${displayCfg.text}`}>
        {student.roll_no}
      </span>
      <span className={`text-sm font-bold leading-tight break-words w-11/12 ${displayCfg.text}`}>
        {student.name}
      </span>
      <span className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full ${
        displayStatus === 'P' ? 'bg-emerald-100 text-emerald-700' :
        displayStatus === 'A' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
      }`}>
        {displayCfg.label}
      </span>
    </button>
  );
}

export default function EditAttendanceModal({ subjects, onClose }) {
  const queryClient = useQueryClient();

  // Form state
  const [subjectId, setSubjectId] = useState(subjects[0]?.subject_id || '');
  const [date, setDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 0);
    return yesterday.toISOString().split('T')[0];
  });
  const [period, setPeriod] = useState(1);
  const [section, setSection] = useState(subjects[0]?.section || '');
  const [search, setSearch] = useState('');

  // Local overrides: roll_no → status ('P'|'A'|'O')
  const [overrides, setOverrides] = useState({});
  const [isDirty,   setIsDirty]   = useState(false);

  const [confirmMsg, setConfirmMsg] = useState('');
  const [showDone,   setShowDone]   = useState(false);

  // Derived selected subject
  const selectedSubject = useMemo(
    () => subjects.find(s => s.subject_id === parseInt(subjectId)),
    [subjects, subjectId]
  );

  // Available sections from selected subject's assignment
  const availableSections = useMemo(() => {
    const secs = subjects
      .filter(s => s.subject_id === parseInt(subjectId))
      .map(s => s.section)
      .filter(Boolean);
    return [...new Set(secs)];
  }, [subjects, subjectId]);

  // Fetch existing records
  const {
    data: records = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['att-records', subjectId, date, period, section],
    queryFn: async () => {
      if (!subjectId) return [];
      const params = new URLSearchParams({
        subject_id: subjectId,
        date,
        period,
        ...(section ? { section } : {}),
      });
      const data = await api.get(`staff/attendance/records?${params}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!subjectId,
    staleTime: 0,
  });

  // Reset overrides when session changes
  useEffect(() => {
    setOverrides({});
    setIsDirty(false);
    setSearch('');
  }, [subjectId, date, period, section]);

  // Reset section when subject changes
  useEffect(() => {
    const sec = subjects.find(s => s.subject_id === parseInt(subjectId))?.section || '';
    setSection(sec);
  }, [subjectId]);

  // Effective status for a record (override > API value > default P)
  const effectiveStatus = (rec) =>
    overrides.hasOwnProperty(rec.roll_no) ? overrides[rec.roll_no] : (rec.status ?? 'P');

  const handleChange = (rollNo, newStatus) => {
    setOverrides(prev => ({ ...prev, [rollNo]: newStatus }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setOverrides({});
    setIsDirty(false);
  };

  // Build submit payload
  const buildPayload = () => {
    const absentees = [];
    const od_list = [];

    records.forEach(rec => {
      const status = effectiveStatus(rec);
      if (status === 'A') absentees.push(rec.roll_no);
      if (status === 'O') od_list.push(rec.roll_no);
    });

    return {
      subject_id: parseInt(subjectId),
      date,
      period: parseInt(period),
      absentees,
      od_list,
      semester: selectedSubject?.semester || 1,
      section: section || undefined,
    };
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('staff/attendance/period', payload),
    onSuccess: () => {
      setIsDirty(false);
      setOverrides({});
      setConfirmMsg(`Attendance for Period ${period} on ${date} updated successfully!`);
      setShowDone(true);
      queryClient.invalidateQueries({ queryKey: ['att-records'] });
      queryClient.invalidateQueries({ queryKey: ['staff-today-summary'] });
      refetch();
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || err.message || 'Save failed');
    },
  });

  // Summary stats
  const stats = useMemo(() => {
    const present = records.filter(r => effectiveStatus(r) === 'P').length;
    const absent  = records.filter(r => effectiveStatus(r) === 'A').length;
    const od      = records.filter(r => effectiveStatus(r) === 'O').length;
    return { present, absent, od, total: records.length };
  }, [records, overrides]);

  const hasAnyRecord = records.some(r => r.is_marked);

  // Date navigation helpers
  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-4xl sm:max-h-[92vh] max-h-[96vh] bg-background rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ━━━ Header ━━━ */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Edit Attendance</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Review &amp; correct any session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* ━━━ Controls ━━━ */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border/40 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Subject
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              >
                {subjects.map(s => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.course_code} — {s.subject_name || s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date with nav arrows */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => shiftDate(-1)}
                  className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => shiftDate(1)}
                  disabled={date >= new Date().toISOString().split('T')[0]}
                  className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Period
              </label>
              <select
                value={period}
                onChange={e => setPeriod(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              >
                {[1,2,3,4,5,6,7].map(p => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Section
              </label>
              <div className="flex gap-1.5">
                {(availableSections.length > 0 ? availableSections : ['A', 'B']).map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSection(sec)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-black uppercase transition-all ${
                      section === sec
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-background border-border text-muted-foreground hover:border-indigo-400'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSection('')}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-black uppercase transition-all ${
                    section === ''
                      ? 'bg-slate-700 border-slate-700 text-white'
                      : 'bg-background border-border text-muted-foreground hover:border-slate-400'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ Status Banner ━━━ */}
        <div className="px-6 py-3 bg-background border-b border-border/30 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            {/* Summary chips */}
            <div className="flex items-center gap-3 text-xs font-black">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {stats.present} Present
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {stats.absent} Absent
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {stats.od} OD
              </span>
              <span className="text-muted-foreground font-normal">/ {stats.total} total</span>
            </div>

            {!hasAnyRecord && !isLoading && records.length > 0 && (
              <span className="ml-auto px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider border border-slate-200">
                No Records Yet — Will Create New
              </span>
            )}
            {hasAnyRecord && (
              <span className="ml-auto px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider border border-indigo-100">
                <History className="w-3 h-3 inline mr-1" />Existing Records Loaded
              </span>
            )}

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or roll…"
                className="pl-9 pr-4 py-1.5 rounded-xl border border-border bg-muted/50 text-xs outline-none focus:ring-2 focus:ring-indigo-400 w-44"
              />
            </div>
          </div>
        </div>

        {/* ━━━ Roster ━━━ */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin opacity-30" />
              <p className="text-xs uppercase tracking-widest font-black animate-pulse">Loading Records…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">No students found</p>
              <p className="text-xs text-muted-foreground">Try a different section or subject</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-3">
                Click to cycle: Present → Absent → On Duty → Present
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {records.map(rec => (
                  <StudentCard
                    key={rec.roll_no}
                    student={rec}
                    status={effectiveStatus(rec)}
                    onChange={handleChange}
                    search={search}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ━━━ Footer Actions ━━━ */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          {showDone ? (
            <div className="flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-700">{confirmMsg}</p>
                  <p className="text-[10px] text-emerald-600">Changes saved to database</p>
                </div>
              </div>
              <button
                onClick={() => { setShowDone(false); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors"
              >
                Edit More
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-end">
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Changes
                </button>
              )}
              <div className="text-xs text-muted-foreground mr-auto">
                {isDirty
                  ? <span className="text-amber-600 font-bold">⚠ Unsaved changes</span>
                  : <span>No pending changes</span>
                }
              </div>
              <button
                onClick={() => saveMutation.mutate(buildPayload())}
                disabled={saveMutation.isPending || records.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-200"
              >
                {saveMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                {isDirty ? 'Save Changes' : 'Save as Present'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
