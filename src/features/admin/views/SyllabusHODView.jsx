import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, TrendingUp, ChevronDown, ChevronRight,
  Loader2, AlertTriangle, Search, CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import api from '../../../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct >= 75) return { bg: 'bg-emerald-500/15', text: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-700' };
  if (pct >= 50) return { bg: 'bg-amber-500/10',   text: 'text-amber-600',   bar: 'bg-amber-400',   badge: 'bg-amber-500/20  text-amber-700'   };
  return             { bg: 'bg-rose-500/10',        text: 'text-rose-600',    bar: 'bg-rose-500',    badge: 'bg-rose-500/20   text-rose-700'     };
}

function MiniProgressBar({ value }) {
  const { bar } = pctColor(value);
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
      <div className={`h-1.5 ${bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function BigProgressRing({ value, size = 64 }) {
  const { text } = pctColor(value);
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const { bar } = pctColor(value);
  const colorMap = { 'bg-emerald-500': '#22c55e', 'bg-amber-400': '#fbbf24', 'bg-rose-500': '#ef4444' };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={colorMap[bar] || '#6366f1'}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-black ${text}`}>{value.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ─── Unit Detail Row ──────────────────────────────────────────────────────────

function UnitDetailRow({ unit }) {
  const colors = pctColor(unit.completion_percentage);
  const isComplete = unit.completion_percentage >= 100;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
        isComplete ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted/50 text-muted-foreground'
      }`}>
        {isComplete ? <CheckCircle2 size={14} /> : unit.unit_number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{unit.unit_title}</p>
        <div className="flex items-center gap-2 mt-1">
          <MiniProgressBar value={unit.completion_percentage} />
          <span className={`text-[10px] font-bold flex-shrink-0 ${colors.text}`}>
            {unit.covered_periods}/{unit.total_periods}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Subject Detail Accordion ─────────────────────────────────────────────────

function SubjectDetail({ subject }) {
  const [open, setOpen] = useState(false);
  const colors = pctColor(subject.overall_completion_percentage);

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          <BookOpen size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{subject.subject_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{subject.course_code}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className={`text-sm font-black ${colors.text}`}>{subject.overall_completion_percentage.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">{subject.total_units} units</p>
          </div>
          <div className="w-16 hidden sm:block">
            <MiniProgressBar value={subject.overall_completion_percentage} />
          </div>
          {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-border/20">
          {subject.units.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No units defined</p>
          ) : (
            subject.units.map(unit => <UnitDetailRow key={unit.id} unit={unit} />)
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({ overview }) {
  const [expanded, setExpanded] = useState(false);
  const colors = pctColor(overview.overall_completion_percentage);
  const hasData = overview.total_units > 0;

  return (
    <div className={`panel overflow-hidden transition-all ${colors.bg}`}>
      <button className="w-full flex items-center gap-4 p-5 text-left" onClick={() => setExpanded(e => !e)}>
        <BigProgressRing value={overview.overall_completion_percentage} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground">{overview.staff_name}</p>
            {!hasData && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                No Data
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{overview.department || 'N/A'}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="font-black text-foreground">{overview.total_subjects}</p>
              <p className="text-muted-foreground">Subjects</p>
            </div>
            <div>
              <p className="font-black text-foreground">{overview.total_covered_periods}</p>
              <p className="text-muted-foreground">Covered</p>
            </div>
            <div>
              <p className={`font-black ${colors.text}`}>
                {Math.max(0, overview.total_planned_periods - overview.total_covered_periods)}
              </p>
              <p className="text-muted-foreground">Remaining</p>
            </div>
          </div>
        </div>

        {expanded
          ? <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
          : <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/30">
          {overview.subjects.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
              No syllabus plans created for this academic year
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {overview.subjects.map(s => <SubjectDetail key={s.subject_id} subject={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main HOD View ────────────────────────────────────────────────────────────

export default function SyllabusHODView() {
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear}-${String(currentYear + 1).slice(-2)}`);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'pct_asc' | 'pct_desc'

  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const y = currentYear - i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['syllabus-hod-overview', academicYear],
    queryFn: () =>
      api.get(`syllabus/hod-overview?academic_year=${academicYear}`),
  });

  const filtered = useMemo(() => {
    if (!data?.staff_overviews) return [];
    let list = data.staff_overviews;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.staff_name.toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'pct_desc': return [...list].sort((a, b) => b.overall_completion_percentage - a.overall_completion_percentage);
      case 'pct_asc':  return [...list].sort((a, b) => a.overall_completion_percentage - b.overall_completion_percentage);
      default:         return [...list].sort((a, b) => a.staff_name.localeCompare(b.staff_name));
    }
  }, [data, search, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    if (!data) return null;
    const withData = data.staff_overviews.filter(s => s.total_units > 0);
    const above75 = withData.filter(s => s.overall_completion_percentage >= 75).length;
    const below50 = withData.filter(s => s.overall_completion_percentage < 50).length;
    return { withData: withData.length, above75, below50 };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600">
        <AlertTriangle size={20} />
        <p className="text-sm font-semibold">Failed to load HOD overview. Check your role permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Syllabus Overview</h2>
          <p className="text-muted-foreground mt-1">
            Track syllabus coverage across all faculty members. Click a card to drill down.
          </p>
        </div>
        <select
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Dept summary */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Dept. Coverage', icon: BarChart3,
              value: `${(data.department_completion_percentage || 0).toFixed(1)}%`,
              color: pctColor(data.department_completion_percentage || 0).text,
            },
            { label: 'Total Staff', icon: Users,       value: data.total_staff },
            { label: 'On Track (≥75%)', icon: CheckCircle2,  value: stats?.above75 ?? '—', color: 'text-emerald-600' },
            { label: 'Needs Attention', icon: AlertTriangle,  value: stats?.below50 ?? '—', color: 'text-rose-600'    },
          ].map(({ label, icon: Icon, value, color }) => (
            <div key={label} className="panel p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <div>
                <p className={`text-2xl font-black ${color || 'text-foreground'}`}>{value}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by staff name or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input-field sm:w-52"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="pct_desc">Sort: Coverage ↓ High first</option>
          <option value="pct_asc">Sort: Coverage ↑ Low first (needs attention)</option>
        </select>
      </div>

      {/* Staff cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No staff found</p>
          <p className="text-sm mt-1">Try adjusting your search or selecting a different academic year.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(overview => (
            <StaffCard key={overview.staff_id} overview={overview} />
          ))}
        </div>
      )}
    </div>
  );
}
