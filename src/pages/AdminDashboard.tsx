import React, { useMemo, useState, useEffect } from "react";
import LeaderboardView from "../features/admin/views/LeaderboardView";
import PlacementView from "../features/admin/views/PlacementView";
import RiskRadarView from "../features/admin/views/RiskRadarView";
import ASIEAdminDashboard from "../features/admin/views/ASIEAdminDashboard";
import SyllabusHODView from "../features/admin/views/SyllabusHODView";
import AchievementsPanel from "../components/AchievementsPanel";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { RobustResponsiveContainer as ResponsiveContainer } from "../components/RobustResponsiveContainer";
import {
  AlertTriangle,
  ArrowUp,
  BadgeCheck,
  Download,
  RefreshCw,
  ShieldAlert,
  Target,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  Search,
  Briefcase,
  Activity,
  Plus,
  Edit3,
  Trash2,
  Edit,
  Settings,
  X,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  BarChart2,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
} from "lucide-react";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import StudentProfile360 from "../components/StudentProfile360";
import GeminiChat from "../components/GeminiChat";
import RAGChat from "../components/RAGChat";
import { validatePassThreshold } from "../utils/performanceUtils";
import NotificationBell from "../components/NotificationBell";
import { isGradedSubject } from "../utils/subjectFilters";
import type {
  AdminCohortAction,
  AdminCommandCenterResponse,
  AdminDirectoryPage,
  PlacementCandidate,
  RiskRegistryResponse,
  SpotlightResult,
  SubjectCatalogItem,
  SubjectLeaderboardResponse,
  FacultyImpactMatrixItem,
  StaffProfile,
  TimetableEntry,
  TimetableListResponse,
} from "../types/enterprise";
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarBgColor(rollNo: string): string {
  let hash = 0;
  for (let i = 0; i < rollNo.length; i++) {
    hash = rollNo.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

function StudentAvatar({ id, name, rollNo, size = 'h-8 w-8 text-xs font-bold' }: { id?: number; name: string; rollNo: string; size?: string }) {
  const [error, setError] = useState(false);
  const baseUrl = (api as any).defaults.baseURL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    setError(false);
  }, [id, rollNo]);

  if (error || !id) {
    const initials = getInitials(name);
    const bgColor = getAvatarBgColor(rollNo || name);
    return (
      <div 
        className={`${size} rounded-full flex items-center justify-center text-white shrink-0 shadow-sm`}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`${baseUrl}/professional/profile/${id}/picture?t=${rollNo}`}
      alt={name}
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover shrink-0 border border-border/40 shadow-sm`}
    />
  );
}

function Metric({
  label,
  value,
  hint,
  onClick,
  trend,
  trendLabel,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "emerald" | "rose" | "amber" | "blue" | "primary";
  icon?: React.ElementType;
}) {
  const colorMap = {
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
    primary: "text-primary",
  };
  const valueColor = color ? colorMap[color] : "text-foreground";
  const accentMap = {
    emerald: "before:bg-emerald-500 bg-emerald-500/5 hover:border-emerald-500/35",
    rose: "before:bg-rose-500 bg-rose-500/5 hover:border-rose-500/35",
    amber: "before:bg-amber-500 bg-amber-500/5 hover:border-amber-500/35",
    blue: "before:bg-blue-500 bg-blue-500/5 hover:border-blue-500/35",
    primary: "before:bg-primary bg-primary/5 hover:border-primary/35",
  };
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/45 p-5 shadow-[0_8px_24px_rgba(2,6,23,0.08)] transition-all duration-200 before:absolute before:inset-y-4 before:left-0 before:w-1 ${
        color ? accentMap[color] : "before:bg-border hover:border-primary/35"
      } ${
        onClick ? "cursor-pointer hover:bg-card/70 hover:shadow-[0_14px_34px_rgba(2,6,23,0.12)]" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-3 text-4xl font-semibold tracking-tight ${valueColor}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/35 ${color ? colorMap[color] : "text-muted-foreground"}`}>
          {Icon ? <Icon size={18} /> : null}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-start gap-2">
        {trend && trendLabel && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-background/35 px-2 py-1 text-[11px] font-bold ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        )}
        <p className="min-w-0 text-sm leading-5 text-muted-foreground">{hint}</p>
      </div>
      {onClick && (
        <span className="absolute bottom-4 right-4 text-primary/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Info size={15} />
        </span>
      )}
    </article>
  );
}

// ─── Metric Drill-Down Modal ──────────────────────────────────────────────────
type MetricDetail = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  formula?: string;
  sources: { label: string; value: string; note?: string; status?: "good" | "warn" | "bad" | "neutral" }[];
  insights?: string[];
  rawData?: { label: string; value: string }[];
};

function MetricDrillDownModal({
  detail,
  onClose,
}: {
  detail: MetricDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;
  const Icon = detail.icon;
  const statusIcon = (s?: "good" | "warn" | "bad" | "neutral") => {
    if (s === "good") return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
    if (s === "bad") return <XCircle size={13} className="text-rose-500 shrink-0" />;
    if (s === "warn") return <AlertTriangle size={13} className="text-amber-500 shrink-0" />;
    return <Minus size={13} className="text-muted-foreground shrink-0" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`px-6 py-5 ${detail.color} flex items-start justify-between gap-4 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Metric Breakdown</p>
              <h2 className="text-xl font-bold text-white leading-tight">{detail.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Current value hero */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
            <p className="text-5xl font-bold text-foreground tracking-tight">{detail.value}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.summary}</p>
          </div>

          {/* Formula */}
          {detail.formula && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">How It's Calculated</p>
              <code className="text-sm text-foreground font-mono">{detail.formula}</code>
            </div>
          )}

          {/* Source data */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-3">Source Signals</p>
            <div className="space-y-2">
              {detail.sources.map((src, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/10 border border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    {statusIcon(src.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{src.label}</p>
                      {src.note && <p className="text-xs text-muted-foreground">{src.note}</p>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{src.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {detail.insights && detail.insights.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-3">AI Insights</p>
              <div className="space-y-2">
                {detail.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">Data refreshed from live database</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentStrip({
  item,
  onOpen,
}: {
  item: any;
  onOpen: (rollNo: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.roll_no)}
      className="row-card w-full text-left group flex items-center gap-3"
    >
      <StudentAvatar id={item.id} name={item.name} rollNo={item.roll_no} size="h-9 w-9 text-xs font-bold" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {item.name}
        </p>

        <p className="text-xs text-muted-foreground">
          {item.roll_no} | Sem {item.current_semester || "-"} | Batch{" "}
          {item.batch || "-"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-right text-xs">
        <div>
          <p className="font-black text-foreground">
            {item.average_grade_points}
          </p>

          <p className="text-muted-foreground">GPA</p>
        </div>

        <div>
          <p className="font-black text-foreground">
            {item.attendance_percentage}%
          </p>

          <p className="text-muted-foreground">Attn</p>
        </div>

        <div>
          <p
            className={`font-black ${item.backlogs > 0 ? "text-rose-600" : "text-foreground"}`}
          >
            {item.backlogs}
          </p>

          <p className="text-muted-foreground">Backlogs</p>
        </div>
      </div>
    </button>
  );
}

// ─── Generic Drill-Down Modal ─────────────────────────────────────────────────
function GenericDrillDownModal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerColor,
  icon: Icon,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerColor: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`px-5 py-4 ${headerColor} flex items-start justify-between gap-4 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2">
              <Icon size={20} className="text-white" />
            </div>
            <div>
              {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{subtitle}</p>}
              <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="mt-0.5 rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">{children}</div>
        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">Live data from SPARK database</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ item }: { item: AdminCohortAction }) {
  const [open, setOpen] = useState(false);
  const toneClass =
    item.tone === "critical"
      ? "bg-rose-500/12 text-rose-700"
      : item.tone === "warning"
        ? "bg-amber-500/12 text-amber-700"
        : item.tone === "positive"
          ? "bg-emerald-500/12 text-emerald-700"
          : "bg-slate-500/12 text-slate-700";
  const headerColor =
    item.tone === "critical" ? "bg-rose-600" :
    item.tone === "warning" ? "bg-amber-600" :
    item.tone === "positive" ? "bg-emerald-600" : "bg-slate-600";
  const IconComp = item.tone === "critical" ? ShieldAlert : item.tone === "warning" ? AlertTriangle : item.tone === "positive" ? BadgeCheck : Zap;

  return (
    <>
      <GenericDrillDownModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={item.title}
        subtitle="HOD Action Required"
        headerColor={headerColor}
        icon={IconComp}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClass}`}>
              {item.tone}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-primary">{item.metric}</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
            <p className="text-sm leading-relaxed text-foreground">{item.detail}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Why This Matters</p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                {item.tone === "critical"
                  ? "This issue requires immediate HOD intervention. Delaying action may impact student outcomes and placement eligibility."
                  : item.tone === "warning"
                  ? "This situation is escalating and needs monitoring. Act within the week to prevent it becoming critical."
                  : item.tone === "positive"
                  ? "This is a positive signal worth amplifying. Share with the team and replicate the approach."
                  : "Routine update — review and acknowledge when convenient."}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Key Metric</p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <code className="text-sm font-mono text-foreground">{item.metric}</code>
            </div>
          </div>
        </div>
      </GenericDrillDownModal>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-[1.5rem] border border-border/70 bg-card/70 p-4 hover:ring-2 hover:ring-primary/30 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{item.detail}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-[0.18em] shrink-0 ${toneClass}`}>
            {item.tone}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{item.metric}</p>
          <span className="text-[10px] text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
        </div>
      </button>
    </>
  );
}

function FacultyCard({ item }: { item: FacultyImpactMatrixItem }) {
  const [open, setOpen] = useState(false);
  const failRate = item.failure_rate ?? 0;
  const avgMarks = item.average_marks ?? 0;
  const headerColor = failRate > 40 ? "bg-rose-600" : failRate > 20 ? "bg-amber-600" : "bg-emerald-600";

  return (
    <>
      <GenericDrillDownModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={item.faculty_name}
        subtitle="Faculty Impact Breakdown"
        headerColor={headerColor}
        icon={Briefcase}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-black tracking-widest px-2 py-0.5 rounded bg-muted/20 border border-border/40">{item.subject_code}</span>
            <span className="text-sm text-muted-foreground">{item.subject_name}</span>
            {item.impact_label && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">{item.impact_label}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Failure Rate", value: `${failRate.toFixed?.(1) ?? failRate}%`, status: failRate > 40 ? "bad" : failRate > 20 ? "warn" : "good" },
              { label: "Avg Marks", value: String(avgMarks.toFixed?.(1) ?? avgMarks), status: avgMarks >= 60 ? "good" : avgMarks >= 40 ? "warn" : "bad" },
              { label: "Students", value: String(item.student_count), status: "neutral" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className={`text-xl font-bold ${
                  s.status === "good" ? "text-emerald-500" : s.status === "bad" ? "text-rose-500" : s.status === "warn" ? "text-amber-500" : "text-foreground"
                }`}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Performance Analysis</p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                {failRate > 40
                  ? `High failure rate of ${failRate.toFixed?.(1)}% detected in ${item.subject_name}. This may indicate subject difficulty, teaching methodology, or student preparation gaps. Consider syllabus review or extra support sessions.`
                  : failRate > 20
                  ? `Moderate failure rate of ${failRate.toFixed?.(1)}%. Monitor closely and consider targeted revision sessions for struggling students.`
                  : `Failure rate is healthy at ${failRate.toFixed?.(1)}%. ${item.faculty_name} is performing well in ${item.subject_name}.`}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">How Failure Rate Is Calculated</p>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <code className="text-xs font-mono text-foreground">Failure Rate = Students scoring below pass threshold / Total students × 100</code>
            </div>
          </div>
        </div>
      </GenericDrillDownModal>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left p-4 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/20 hover:ring-2 hover:ring-primary/30 transition-all group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.faculty_name}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{item.subject_code}</p>
          </div>
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shrink-0">{item.impact_label || "IMPACT"}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.subject_name}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-bold text-foreground">
          <div>
            <p className={`text-lg leading-tight ${failRate > 40 ? "text-rose-500" : failRate > 20 ? "text-amber-500" : "text-emerald-500"}`}>{failRate.toFixed?.(1) ?? failRate}%</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fail Rate</p>
          </div>
          <div>
            <p className="text-lg leading-tight">{avgMarks.toFixed?.(1) ?? avgMarks}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg Marks</p>
          </div>
          <div>
            <p className="text-lg leading-tight">{item.student_count}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Students</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">Click to view breakdown →</p>
      </button>
    </>
  );
}

// ─── Command Alert Row ────────────────────────────────────────────────────────
function CommandAlertRow({ alert }: { alert: string }) {
  const [open, setOpen] = useState(false);
  const isCritical = /risk|fail|backlog|critical|below|drop/i.test(alert);
  const isWarning = /warn|low|attention|monitor/i.test(alert);
  const headerColor = isCritical ? "bg-rose-600" : isWarning ? "bg-amber-600" : "bg-slate-600";
  const IconComp = isCritical ? ShieldAlert : isWarning ? AlertTriangle : Info;

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title="Command Alert" subtitle="System Detection" headerColor={headerColor} icon={IconComp}>
        <div className="p-5 space-y-4">
          <div className={`p-4 rounded-xl border ${isCritical ? "bg-rose-500/5 border-rose-500/20" : isWarning ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-500/5 border-slate-500/20"}`}>
            <p className="text-sm text-foreground leading-relaxed">{alert}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Severity Classification</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/10 border border-border/40">
              <IconComp size={14} className={isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-slate-500"} />
              <p className="text-sm text-foreground font-medium">
                {isCritical ? "Critical — Immediate HOD action required" : isWarning ? "Warning — Monitor and plan intervention" : "Informational — No immediate action needed"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">What Triggers This Alert</p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                {isCritical
                  ? "This alert is triggered when a student metric crosses a critical threshold \u2014 such as attendance dropping below 60%, GPA below 5.0, or a surge in active backlogs. It signals a systemic issue requiring prompt review."
                  : isWarning
                  ? "This alert fires when a metric is trending toward a critical threshold but hasn\u2019t crossed it yet. It gives HODs a window to intervene before the situation worsens."
                  : "This is a routine system notification about a data anomaly or a minor boundary condition. Review at your convenience."}
              </p>
            </div>
          </div>
        </div>
      </GenericDrillDownModal>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 shrink-0 ${isCritical ? "bg-rose-500/10 text-rose-500" : isWarning ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500"}`}>
            <AlertTriangle size={16} />
          </div>
          <p className="text-sm text-foreground flex-1 min-w-0 group-hover:text-primary transition-colors line-clamp-2">{alert}</p>
          <span className="text-[10px] text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
        </div>
      </button>
    </>
  );
}

// ─────────────────── Batch Health Row ─────────────────────────────────────────
function BatchHealthRow({ batch, deptAvgGpa, deptAvgAttn }: { batch: any; deptAvgGpa: number; deptAvgAttn: number }) {
  const [open, setOpen] = useState(false);
  const atRiskPct = batch.student_count > 0 ? ((batch.at_risk_count / batch.student_count) * 100).toFixed(1) : "0";
  const gpaVsDept = (batch.average_gpa - deptAvgGpa).toFixed(2);
  const attnVsDept = (batch.average_attendance - deptAvgAttn).toFixed(1);
  const headerColor = batch.average_gpa >= 6 && batch.average_attendance >= 75 ? "bg-emerald-600" : batch.average_gpa >= 5 ? "bg-amber-600" : "bg-rose-600";

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title={`Batch ${batch.batch}`} subtitle="Batch Health Breakdown" headerColor={headerColor} icon={Users}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Students", value: String(batch.student_count), status: "neutral" as const },
              { label: "At Risk", value: `${batch.at_risk_count} (${atRiskPct}%)`, status: (batch.at_risk_count === 0 ? "good" : batch.at_risk_count < 5 ? "warn" : "bad") as "good"|"warn"|"bad" },
              { label: "Avg GPA", value: `${batch.average_gpa} / 10`, status: (batch.average_gpa >= 7 ? "good" : batch.average_gpa >= 5 ? "warn" : "bad") as "good"|"warn"|"bad" },
              { label: "Attendance", value: `${batch.average_attendance}%`, status: (batch.average_attendance >= 75 ? "good" : batch.average_attendance >= 60 ? "warn" : "bad") as "good"|"warn"|"bad" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className={`text-xl font-bold ${s.status === "good" ? "text-emerald-500" : s.status === "bad" ? "text-rose-500" : s.status === "warn" ? "text-amber-500" : "text-foreground"}`}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">vs. Department Average</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/40">
                <span className="text-sm text-foreground">GPA vs Dept Avg ({deptAvgGpa})</span>
                <span className={`text-sm font-bold ${Number(gpaVsDept) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{Number(gpaVsDept) >= 0 ? "+" : ""}{gpaVsDept}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/40">
                <span className="text-sm text-foreground">Attendance vs Dept Avg ({deptAvgAttn}%)</span>
                <span className={`text-sm font-bold ${Number(attnVsDept) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{Number(attnVsDept) >= 0 ? "+" : ""}{attnVsDept}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              {batch.at_risk_count > 0
                ? `${batch.at_risk_count} student${batch.at_risk_count !== 1 ? "s" : ""} (${atRiskPct}%) in this batch need intervention. Check the Risk Radar for individual profiles.`
                : "All students in this batch are performing within acceptable ranges. No immediate intervention required."}
            </p>
          </div>
        </div>
      </GenericDrillDownModal>

      <button type="button" onClick={() => setOpen(true)} className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all">
        <div className="flex items-center justify-between w-full gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Batch {batch.batch}</p>
            <p className="text-xs text-muted-foreground">{batch.student_count} students | {batch.at_risk_count} at risk</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${batch.average_gpa >= 7 ? "text-emerald-600" : batch.average_gpa >= 5 ? "text-amber-600" : "text-rose-600"}`}>{batch.average_gpa} GPA</p>
            <p className={`text-xs ${batch.average_attendance >= 75 ? "text-emerald-500" : "text-amber-500"}`}>{batch.average_attendance}% Attn</p>
          </div>
        </div>
      </button>
    </>
  );
}

// \u2500\u2500\u2500 Semester Pulse Row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function SemesterPulseRow({ pulse }: { pulse: any }) {
  const [open, setOpen] = useState(false);
  const riskPct = pulse.student_count > 0 ? ((pulse.at_risk_count / pulse.student_count) * 100).toFixed(1) : "0";
  const headerColor = pulse.average_gpa >= 7 ? "bg-emerald-600" : pulse.average_gpa >= 5 ? "bg-amber-600" : "bg-rose-600";

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title={`Semester ${pulse.semester}`} subtitle="Semester Performance" headerColor={headerColor} icon={BookOpen}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Enrollment", value: String(pulse.student_count), status: "neutral" as const },
              { label: "Flagged", value: `${pulse.at_risk_count} (${riskPct}%)`, status: (pulse.at_risk_count === 0 ? "good" : "warn") as "good"|"warn" },
              { label: "Avg GPA", value: String(pulse.average_gpa), status: (pulse.average_gpa >= 7 ? "good" : pulse.average_gpa >= 5 ? "warn" : "bad") as "good"|"warn"|"bad" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className={`text-xl font-bold ${s.status === "good" ? "text-emerald-500" : s.status === "bad" ? "text-rose-500" : s.status === "warn" ? "text-amber-500" : "text-foreground"}`}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">GPA Interpretation</p>
            <p className="text-sm text-foreground">
              {pulse.average_gpa >= 8 ? "Excellent cohort — well above placement standards." :
               pulse.average_gpa >= 7 ? "Good performance — meets most industry benchmarks." :
               pulse.average_gpa >= 5 ? "Average performance — some students need support." :
               "Below average — targeted interventions recommended for this semester cohort."}
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              {pulse.at_risk_count === 0
                ? "No students flagged as at-risk in this semester."
                : `${pulse.at_risk_count} student${pulse.at_risk_count !== 1 ? "s" : ""} (${riskPct}%) in Semester ${pulse.semester} are flagged for academic risk.`}
            </p>
          </div>
        </div>
      </GenericDrillDownModal>

      <button type="button" onClick={() => setOpen(true)} className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all">
        <div className="flex items-center justify-between w-full gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Semester {pulse.semester}</p>
            <p className="text-xs text-muted-foreground">{pulse.student_count} enrollment | {pulse.at_risk_count} flagging</p>
          </div>
          <p className={`text-sm font-bold shrink-0 ${pulse.average_gpa >= 7 ? "text-emerald-600" : pulse.average_gpa >= 5 ? "text-amber-600" : "text-rose-600"}`}>{pulse.average_gpa} avg</p>
        </div>
      </button>
    </>
  );
}

// \u2500\u2500\u2500 Subject Coverage Row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function SubjectCoverageRow({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const coveragePct = item.total_subjects > 0 ? Math.round((item.ranked_subjects / item.total_subjects) * 100) : 0;
  const headerColor = coveragePct >= 80 ? "bg-emerald-600" : coveragePct >= 50 ? "bg-amber-600" : "bg-rose-600";

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title={`Semester ${item.semester} Coverage`} subtitle="Subject Ranking Coverage" headerColor={headerColor} icon={BarChart2}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: String(item.total_subjects), status: "neutral" as const },
              { label: "Ranked", value: String(item.ranked_subjects), status: (item.ranked_subjects === item.total_subjects ? "good" : item.ranked_subjects > 0 ? "warn" : "bad") as "good"|"warn"|"bad" },
              { label: "Coverage", value: `${coveragePct}%`, status: (coveragePct >= 80 ? "good" : coveragePct >= 50 ? "warn" : "bad") as "good"|"warn"|"bad" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className={`text-xl font-bold ${s.status === "good" ? "text-emerald-500" : s.status === "bad" ? "text-rose-500" : s.status === "warn" ? "text-amber-500" : "text-foreground"}`}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">What Is Ranking Coverage?</p>
            <p className="text-sm text-foreground">A subject is "ranked" when at least one student has a recorded mark or grade for it. Out of {item.total_subjects} subjects in Semester {item.semester}, {item.ranked_subjects} have performance data. Missing data reduces the accuracy of leaderboard and bottleneck analysis.</p>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
            <div className={`h-full transition-all ${coveragePct >= 80 ? "bg-emerald-500" : coveragePct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${coveragePct}%` }} />
          </div>
        </div>
      </GenericDrillDownModal>

      <button type="button" onClick={() => setOpen(true)} className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all">
        <div className="flex items-center justify-between w-full gap-3">
          <p className="text-sm font-bold group-hover:text-primary transition-colors">Sem {item.semester}</p>
          <p className="text-xs text-muted-foreground">{item.ranked_subjects}/{item.total_subjects} Ranked</p>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
          <div className={`h-full ${coveragePct >= 80 ? "bg-emerald-500" : coveragePct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${coveragePct}%` }} />
        </div>
      </button>
    </>
  );
}

// \u2500\u2500\u2500 Attendance Batch Row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AttendanceBatchRow({ batch }: { batch: any }) {
  const [open, setOpen] = useState(false);
  const attn = batch.average_attendance ?? 0;
  const attnColor = attn >= 75 ? "text-emerald-600" : attn >= 60 ? "text-amber-600" : "text-rose-600";
  const barColor = attn >= 75 ? "bg-emerald-500" : attn >= 60 ? "bg-amber-500" : "bg-rose-500";
  const headerColor = attn >= 75 ? "bg-emerald-600" : attn >= 60 ? "bg-amber-600" : "bg-rose-600";

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title={`Batch ${batch.batch} Attendance`} subtitle="Attendance Analysis" headerColor={headerColor} icon={Clock}>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
            <p className={`text-5xl font-bold ${attnColor}`}>{attn}%</p>
            <div>
              <p className="text-sm font-semibold text-foreground">{batch.student_count} students</p>
              <p className="text-xs text-muted-foreground">{batch.at_risk_count ?? 0} at risk overall</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Attendance</span>
              <span className={`text-xs font-bold ${attnColor}`}>{attn}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
              <div className={`h-full ${barColor} transition-all`} style={{ width: `${attn}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">Attendance Thresholds</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <span className="text-emerald-500">\u2265 75%</span> — Good standing, placement eligible</li>
              <li>• <span className="text-amber-500">60\u201374%</span> — Warning zone, condonation may be required</li>
              <li>• <span className="text-rose-500">&lt; 60%</span> — At risk, ineligible for exams without special approval</li>
            </ul>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              {attn >= 75
                ? `Batch ${batch.batch} has a healthy attendance average. Keep encouraging consistent class participation.`
                : attn >= 60
                ? `Batch ${batch.batch} is in the warning zone. Notify coordinators to follow up with students missing classes.`
                : `Critical attendance in Batch ${batch.batch}. Many students may be ineligible for exams. Immediate intervention required.`}
            </p>
          </div>
        </div>
      </GenericDrillDownModal>

      <button type="button" onClick={() => setOpen(true)} className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all">
        <div className="flex items-center justify-between gap-3 w-full">
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Batch {batch.batch}</p>
            <p className="text-xs text-muted-foreground">{batch.student_count} students</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 sm:w-36 md:w-48">
              <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                <div className={`h-full transition-all ${barColor}`} style={{ width: `${attn}%` }} />
              </div>
            </div>
            <p className={`font-bold text-right w-12 ${attnColor}`}>{attn}%</p>
          </div>
        </div>
      </button>
    </>
  );
}

// \u2500\u2500\u2500 Attendance Semester Row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AttendanceSemesterRow({ pulse }: { pulse: any }) {
  const [open, setOpen] = useState(false);
  const attn = pulse.avg_attendance ?? 0;
  const attnColor = attn >= 75 ? "text-emerald-600" : attn >= 60 ? "text-amber-600" : "text-rose-600";
  const headerColor = attn >= 75 ? "bg-emerald-600" : attn >= 60 ? "bg-amber-600" : "bg-rose-600";

  return (
    <>
      <GenericDrillDownModal isOpen={open} onClose={() => setOpen(false)} title={`Semester ${pulse.semester} Attendance`} subtitle="Semester Attendance" headerColor={headerColor} icon={Clock}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
              <p className={`text-2xl font-bold ${attnColor}`}>{attn !== "N/A" ? `${attn}%` : "N/A"}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Avg Attendance</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/10 border border-border/40 text-center">
              <p className="text-2xl font-bold text-foreground">{pulse.student_count ?? "\u2014"}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Students</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              {attn === "N/A" || attn === 0
                ? "No attendance data recorded for this semester yet."
                : attn >= 75
                ? `Semester ${pulse.semester} attendance is healthy at ${attn}%.`
                : `Semester ${pulse.semester} attendance (${attn}%) is below the recommended 75% threshold. Follow up with semester coordinators.`}
            </p>
          </div>
        </div>
      </GenericDrillDownModal>

      <button type="button" onClick={() => setOpen(true)} className="row-card w-full text-left group hover:ring-2 hover:ring-primary/30 transition-all">
        <div className="flex items-center justify-between w-full gap-3">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Semester {pulse.semester}</p>
          <p className={`text-xs font-bold ${attnColor}`}>{attn !== "N/A" ? `${attn}%` : "N/A"} average</p>
        </div>
      </button>
    </>
  );
}

function exportWithToken(path: string, filename: string) {
  const token = localStorage.getItem("spark-auth-storage");

  const parsed = token ? JSON.parse(token) : null;

  const accessToken = parsed?.state?.token;

  // Ensure path doesn't start with / to avoid double-slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return fetch(`${api.defaults.baseURL}/${cleanPath}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = filename;

      document.body.appendChild(a);

      a.click();

      a.remove();
    })

    .catch((error) => console.error("Export error:", error));
}

function AdminPasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.patch("admin/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto p-6 rounded-2xl border border-border/60 bg-card shadow transition-colors"
    >
      <h2 className="text-lg font-bold mb-4 text-foreground">
        Change Admin Password
      </h2>
      {message && (
        <div className="mb-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-2 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-1 font-semibold text-muted-foreground">
          Current Password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-muted/10 dark:bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold text-muted-foreground">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-muted/10 dark:bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>
      <div className="mb-6">
        <label className="block mb-1 font-semibold text-muted-foreground">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-muted/10 dark:bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-primary text-primary-foreground font-bold py-2 transition-colors hover:bg-primary/90 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}

// Threshold Configuration Modal Component
function ThresholdConfigModal({ 
  subject, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  subject: SubjectCatalogItem | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (subjectId: number, threshold: number) => void; 
}) {
  const [passThreshold, setPassThreshold] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (subject && isOpen) {
      setPassThreshold(subject.pass_threshold?.toString() || "40");
      setError("");
    }
  }, [subject, isOpen]);

  const handleSave = () => {
    const threshold = parseFloat(passThreshold);
    
    // Validate threshold
    const validation = validatePassThreshold(threshold);
    if (!validation.isValid) {
      setError(validation.error || "Invalid threshold");
      return;
    }

    if (subject) {
      onSave(subject.id, threshold);
      onClose();
    }
  };

  if (!isOpen || !subject) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background border border-border rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Configure Threshold
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Subject: <span className="font-mono text-accent">{subject.subject_code}</span> - {subject.subject_name}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Pass Threshold (Minimum marks to pass)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={passThreshold}
              onChange={(e) => {
                setPassThreshold(e.target.value);
                setError("");
              }}
              className="input-field w-full"
              placeholder="e.g., 40"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <div className="bg-muted/10 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-foreground">Performance Classification Rules:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <span className="text-red-500">At Risk</span>: Marks &lt; threshold OR percentile &lt; 30</li>
              <li>• <span className="text-yellow-500">Average</span>: Percentile 30-60</li>
              <li>• <span className="text-blue-500">Good</span>: Percentile 60-85</li>
              <li>• <span className="text-green-500">Excellent</span>: Percentile &gt; 85</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!passThreshold || error}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Threshold
          </button>
        </div>
      </div>
    </div>
  );
}

// Subjects Management Panel Component
function SubjectsManagementPanel({ studentBatchFilter, studentSectionFilter }: { studentBatchFilter: string; studentSectionFilter: string }) {
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // Added status filter
  const [subjectCatalog, setSubjectCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCatalogItem | null>(null);
  const queryClient = useQueryClient();

  // Fetch subjects
  const {
    data: subjects,
    isLoading: loadingSubjects,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (studentBatchFilter !== "ALL") {
        params.set("batch", studentBatchFilter);
      }
      if (studentSectionFilter !== "ALL") {
        params.set("section", studentSectionFilter);
      }
      const queryString = params.toString();
      return api.get(`admin/subject-catalog${queryString ? `?${queryString}` : ""}`);
    },
  });

  // Toggle subject mutation with optimistic updates
  const toggleSubjectMutation = useMutation({
    mutationFn: (subjectId: number) => {
      console.log("🔄 Toggling subject ID:", subjectId);
      return api.patch(`admin/subjects/${subjectId}/toggle`);
    },
    onMutate: async (subjectId) => {
      console.log(
        "🔄 onMutate - Optimistically updating UI for subject:",
        subjectId,
      );

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter] });

      // Snapshot the previous value
      const previousSubjects = queryClient.getQueryData([
        "admin-subject-catalog", studentBatchFilter, studentSectionFilter,
      ]);

      // Optimistically update the UI
      queryClient.setQueryData(["admin-subject-catalog", studentBatchFilter, studentSectionFilter], (old: any) => {
        if (!old) return old;
        return old.map((subject: any) =>
          subject.id === subjectId
            ? { ...subject, is_active: !subject.is_active }
            : subject,
        );
      });

      console.log("✅ Optimistic update applied");

      // Return context with the previous value
      return { previousSubjects };
    },
    onSuccess: async (data) => {
      console.log("✅ Toggle successful:", data);
      console.log("🔄 Refetching to confirm server state...");

      // Refetch to ensure server state is in sync
      await queryClient.invalidateQueries({
        queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
        refetchType: "active",
      });

      console.log("✅ Refetch completed");
    },
    onError: (error, subjectId, context: any) => {
      console.error("❌ Toggle failed:", error);

      // Rollback optimistic update on error
      if (context?.previousSubjects) {
        queryClient.setQueryData(
          ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
          context.previousSubjects,
        );
      }

      alert(`Failed to toggle subject: ${error.message || "Unknown error"}`);
    },
  });

  // Update threshold mutation with optimistic updates
  const updateThresholdMutation = useMutation({
    mutationFn: ({ subjectId, threshold }: { subjectId: number; threshold: number }) => {
      console.log("🔄 Updating threshold for subject ID:", subjectId, "to:", threshold);
      return api.patch(`admin/subjects/${subjectId}/threshold`, { pass_threshold: threshold });
    },
    onMutate: async ({ subjectId, threshold }) => {
      console.log("🔄 onMutate - Optimistically updating threshold for subject:", subjectId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter] });

      // Snapshot the previous value
      const previousSubjects = queryClient.getQueryData([
        "admin-subject-catalog", studentBatchFilter, studentSectionFilter,
      ]);

      // Optimistically update the UI
      queryClient.setQueryData(["admin-subject-catalog", studentBatchFilter, studentSectionFilter], (old: any) => {
        if (!old) return old;
        return old.map((subject: any) =>
          subject.id === subjectId
            ? { ...subject, pass_threshold: threshold }
            : subject,
        );
      });

      console.log("✅ Optimistic threshold update applied");

      // Return context with the previous value
      return { previousSubjects };
    },
    onSuccess: async (data) => {
      console.log("✅ Threshold update successful:", data);
      
      // Refetch to ensure server state is in sync
      await queryClient.invalidateQueries({
        queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
        refetchType: "active",
      });
      
      console.log("✅ Threshold refetch completed");
    },
    onError: (error, { subjectId }, context: any) => {
      console.error("❌ Threshold update failed:", error);

      // Rollback optimistic update on error
      if (context?.previousSubjects) {
        queryClient.setQueryData(
          ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
          context.previousSubjects,
        );
      }

      alert(`Failed to update threshold: ${error.message || "Unknown error"}`);
    },
  });

  const handleToggleSubject = (subjectId: number) => {
    console.log("🖱️ Toggle button clicked for subject ID:", subjectId);
    toggleSubjectMutation.mutate(subjectId);
  };

  const handleConfigureThreshold = (subject: SubjectCatalogItem) => {
    setSelectedSubject(subject);
    setThresholdModalOpen(true);
  };

  const handleSaveThreshold = (subjectId: number, threshold: number) => {
    updateThresholdMutation.mutate({ subjectId, threshold });
  };

  const groupedSubjects = useMemo(() => {
    if (!subjects) return {};

    let filtered = subjects;
    if (semesterFilter !== "ALL") {
      filtered = filtered.filter((s) => String(s.semester) === semesterFilter);
    }

    // Apply status filtering
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((s) => s.is_active);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((s) => !s.is_active);
    }

    return filtered.reduce((acc, subject) => {
      const semester = subject.semester || "Unknown";
      if (!acc[semester]) acc[semester] = [];
      acc[semester].push(subject);
      return acc;
    }, {});
  }, [subjects, semesterFilter, statusFilter]);

  const semesterOptions = useMemo(() => {
    if (!subjects) return [];
    const semesters = [
      ...new Set(subjects.map((s) => s.semester).filter((s) => Boolean(s) && String(s) !== "0")),
    ];
    return semesters.sort((a, b) => a - b);
  }, [subjects]);

  const totalSubjects = subjects?.length || 0;
  const activeSubjects = subjects?.filter((s) => s.is_active)?.length || 0;
  const inactiveSubjects = totalSubjects - activeSubjects;
  return (
    <div className="space-y-6">
      <div className="panel p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Subject Management
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Control which subjects are active for the current semester
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field flex-1 sm:w-32 !py-2"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="input-field flex-1 sm:w-32 !py-2"
            >
              <option value="ALL">All Semesters</option>
              {semesterOptions.map((sem) => (
                <option key={sem} value={String(sem)}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
          <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/50">
            <p className="text-2xl font-bold text-foreground leading-none mb-1">
              {totalSubjects}
            </p>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Total Subjects
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-600 leading-none mb-1">
              {activeSubjects}
            </p>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Active
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-2xl font-bold text-rose-600 leading-none mb-1">
              {inactiveSubjects}
            </p>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Inactive
            </p>
          </div>
        </div>
      </div>

      {/* Subject Groups by Semester */}
      {loadingSubjects ? (
        <div className="panel text-center py-12">
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSubjects)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([semester, semesterSubjects]) => (
              <div key={semester} className="panel p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Semester {semester}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const subjectsToEnable = semesterSubjects.filter(
                          (s) => !s.is_active,
                        );
                        for (const s of subjectsToEnable) {
                          try {
                            await toggleSubjectMutation.mutateAsync(s.id);
                          } catch (e) {
                            console.error("Failed to enable subject", s.id, e);
                          }
                        }
                      }}
                      className="text-xs px-3 py-1.5 font-bold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-95 transition-all"
                      disabled={toggleSubjectMutation.isPending}
                    >
                      Enable All
                    </button>
                    <button
                      onClick={async () => {
                        const subjectsToDisable = semesterSubjects.filter(
                          (s) => s.is_active,
                        );
                        for (const s of subjectsToDisable) {
                          try {
                            await toggleSubjectMutation.mutateAsync(s.id);
                          } catch (e) {
                            console.error("Failed to disable subject", s.id, e);
                          }
                        }
                      }}
                      className="text-xs px-3 py-1.5 font-bold rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:scale-95 transition-all"
                      disabled={toggleSubjectMutation.isPending}
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {semesterSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/40 gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black tracking-widest px-2 py-0.5 rounded bg-muted/20 text-accent border border-border/40">
                              {subject.subject_code}
                            </span>
                            {subject.records > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-wider">
                                {subject.records} records
                              </span>
                            )}
                            {subject.pass_threshold && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-black uppercase tracking-wider">
                                Pass: {subject.pass_threshold}%
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-foreground text-sm sm:text-base">
                            {subject.subject_name}
                          </span>
                        </div>
                        {subject.pass_threshold && (
                          <div className="text-xs text-muted-foreground">
                            Performance analytics enabled • Threshold: {subject.pass_threshold}% minimum
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            subject.is_active
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {subject.is_active ? "Active" : "Inactive"}
                        </span>

                        <button
                          onClick={() => handleConfigureThreshold(subject)}
                          disabled={updateThresholdMutation.isPending}
                          className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all active:scale-95"
                          title="Configure Performance Threshold"
                        >
                          <Settings size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleSubject(subject.id)}
                          disabled={toggleSubjectMutation.isPending}
                          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 ${
                            subject.is_active
                              ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          }`}
                        >
                          {subject.is_active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {semesterSubjects.filter((s) => s.is_active).length} of{" "}
                  {semesterSubjects.length} subjects active
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Threshold Configuration Modal */}
      <ThresholdConfigModal
        subject={selectedSubject}
        isOpen={thresholdModalOpen}
        onClose={() => {
          setThresholdModalOpen(false);
          setSelectedSubject(null);
        }}
        onSave={handleSaveThreshold}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "Overview";

  // Add password change form to Profile tab
  const renderProfileTab = () => (
    <div className="p-4">
      <AdminPasswordChangeForm />
      {/* Add other profile settings here if needed */}
    </div>
  );

  const urlRollNo = searchParams.get("rollNo");

  const queryClient = useQueryClient();

  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);

    params.set("tab", tab);

    setSearchParams(params);
  };

  const assignSectionsMutation = useMutation({
    mutationFn: async (batch: string) => {
      const response = await api.post(
        `admin/assign-sections?batch=${encodeURIComponent(batch)}`,
      );

      return response.data;
    },

    onSuccess: (data) => {
      console.log("Sections assigned:", data.message);

      queryClient.invalidateQueries({ queryKey: ["admin-students-paginated"] });

      queryClient.invalidateQueries({ queryKey: ["admin-students"] });

      queryClient.invalidateQueries({ queryKey: ["admin-command-center"] });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (payload: any) => api.post("admin/students", payload),
    onSuccess: (response: any) => {
      const data = response?.data ?? response;
      setAddStudentResult(data);
      setAddStudentError("");
      queryClient.invalidateQueries({ queryKey: ["admin-students-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-command-center"] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create student";
      setAddStudentError(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async (payload: any) => api.post("admin/staff", payload),
    onSuccess: async (response: any) => {
      try {
        // Extract staff ID from response - try common locations
        const newId = response?.id ?? response?.data?.id ?? response?.staff_id;
        if (!newId) {
          console.error("Could not extract staff ID from response:", response);
          throw new Error("Invalid response format: missing staff ID");
        }

        // Only assign subjects if any are selected
        const subjectPayload = buildSubjectPayload();
        console.log("CREATE: Subject payload:", subjectPayload);
        if (
          subjectPayload.subject_ids.length > 0 ||
          subjectPayload.subject_codes.length > 0
        ) {
          console.log(
            "CREATE: Calling subject assignment API for staff ID:",
            newId,
          );
          await api.post(`admin/staff/${newId}/subjects`, subjectPayload);
          console.log("CREATE: Subject assignment completed");
        } else {
          console.log("CREATE: No subjects selected, skipping assignment");
        }
      } catch (e) {
        console.error("Failed assigning subjects to new staff", e);
        // Don't prevent form from closing - subjects can be assigned later
      }
      setStaffForm({
        username: "",
        name: "",
        email: "",
        department: "",
        password: "password123",
      });
      setEditingStaff(null);
      setStaffModalOpen(false);
      refetchStaff();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create staff";
      alert(`Error creating staff: ${errorMessage}`);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) =>
      api.patch(`admin/staff/${id}`, payload),
    onSuccess: async (_data, variables: any) => {
      try {
        // Only update subjects if any are selected
        const subjectPayload = buildSubjectPayload();
        console.log("UPDATE: Subject payload:", subjectPayload);
        if (
          subjectPayload.subject_ids.length > 0 ||
          subjectPayload.subject_codes.length > 0
        ) {
          console.log(
            "UPDATE: Calling subject assignment API for staff ID:",
            variables.id,
          );
          await api.post(
            `admin/staff/${variables.id}/subjects`,
            subjectPayload,
          );
          console.log("UPDATE: Subject assignment completed");
        } else {
          console.log("UPDATE: No subjects selected, clearing assignments");
          // Clear all subjects if none are selected
          await api.post(`admin/staff/${variables.id}/subjects`, {
            subject_ids: [],
            subject_codes: [],
          });
        }
      } catch (e) {
        console.error("Failed updating staff subjects", e);
        // Don't prevent form from closing - subjects can be assigned later
      }
      setStaffForm({
        username: "",
        name: "",
        email: "",
        department: "",
        password: "password123",
      });
      setEditingStaff(null);
      setStaffModalOpen(false);
      refetchStaff();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update staff";
      alert(`Error updating staff: ${errorMessage}`);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`admin/staff/${id}`),
    onError: (error: any) => {
      const status = error?.response?.status;
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete staff";

      if (status === 405) {
        alert(
          "Delete is not allowed by the server (405). Please remove this user manually in the backend.",
        );
      } else {
        alert(`Error deleting staff: ${errorMessage}`);
      }
    },
    onSuccess: (_data, id) => {
      if (editingStaff?.id === id) {
        setEditingStaff(null);
        setStaffForm({
          username: "",
          name: "",
          email: "",
          department: "",
          password: "password123",
        });
      }
      refetchStaff();
    },
  });

  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");

  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");

  const [selectedRollNo, setSelectedRollNo] = useState<string | null>(null);

  // Scroll to anchor on activeTab changes or direct link clicks

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && activeTab === "Overview") {
      const tryScroll = () => {
        const element = document.getElementById(hash.substring(1));
        const mainScroll = document.getElementById("main-scroll");
        if (element && mainScroll) {
          const containerTop = mainScroll.getBoundingClientRect().top;
          const elementTop = element.getBoundingClientRect().top;
          const topOffset =
            elementTop - containerTop + mainScroll.scrollTop - 60;

          mainScroll.scrollTo({
            top: topOffset > 0 ? topOffset : 0,
            behavior: "smooth",
          });
        }
      };

      setTimeout(tryScroll, 100);
      setTimeout(tryScroll, 500);
      setTimeout(tryScroll, 1500);
      setTimeout(tryScroll, 3000);
    }
  }, [activeTab]);

  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [studentSearch, setStudentSearch] = useState("");

  const [studentOffset, setStudentOffset] = useState(0);

  const [studentSemesterFilter, setStudentSemesterFilter] =
    useState<string>("ALL");

  const [studentBatchFilter, setStudentBatchFilter] = useState<string>("ALL");

  const [studentSectionFilter, setStudentSectionFilter] =
    useState<string>("ALL");

  const [studentRiskOnly, setStudentRiskOnly] = useState(false);

  const [studentSortBy, setStudentSortBy] = useState<
    "rank" | "name" | "roll_no" | "reg_no" | "gpa" | "attendance" | "backlogs"
  >("rank");

  const [studentSortDir, setStudentSortDir] = useState<"asc" | "desc">("asc");

  const [sorting, setSorting] = useState<SortingState>([
    { id: "cgpa", desc: true },
  ]);

  const [riskLevel, setRiskLevel] = useState<
    "Critical" | "High" | "Moderate" | "Low" | ""
  >("Critical");

  const [staffForm, setStaffForm] = useState({
    username: "",
    name: "",
    email: "",
    department: "",
    password: "password123",
  });

  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

  const [staffSearch, setStaffSearch] = useState("");

  const [staffToDelete, setStaffToDelete] = useState<StaffProfile | null>(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffSubjectKeys, setStaffSubjectKeys] = useState<string[]>([]);
  const [staffSubjectSearch, setStaffSubjectSearch] = useState("");
  const [staffSubjectSemFilter, setStaffSubjectSemFilter] = useState<
    "ALL" | number
  >("ALL");

  // Timetable state variables
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: number, period: number} | null>(null);
  const [timetableForm, setTimetableForm] = useState({
    batch: "",
    section: "A",
    day_of_week: 1,
    period: 1,
    subject_id: null as number | null,
    faculty_id: null as number | null,
    academic_year: "2024-25",
    semester: 1
  });
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedTimetableSemester, setSelectedTimetableSemester] = useState("");

  // ── Add Student modal state ──────────────────────────────────────────────────
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    roll_no: "",
    name: "",
    dob: "",
    email: "",
    batch: "",
    reg_no: "",
    section: "",
    current_semester: "",
  });
  const [addStudentResult, setAddStudentResult] = useState<{
    roll_no: string; name: string; username: string; initial_password: string;
    batch?: string; section?: string; current_semester?: number;
  } | null>(null);
  const [addStudentError, setAddStudentError] = useState("");

  // ── Add Batch modal state ────────────────────────────────────────────────────
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [addBatchError, setAddBatchError] = useState("");

  const makeSubjectKey = (s: any, idx: number) => {
    // Use ID as primary key for stability, fallback to course_code, then index only if absolutely necessary
    if (s?.id !== undefined && s?.id !== null) {
      return String(s.id);
    }
    // If no ID, use subject_code (most stable)
    if (s?.subject_code) {
      return `code-${s.subject_code}`;
    }
    if (s?.course_code) {
      return `code-${s.course_code}`;
    }
    if (s?.code) {
      return `code-${s.code}`;
    }
    // Last resort - use index, but log warning
    console.warn(
      "Subject missing ID and codes, using unstable index-based key:",
      s,
    );
    return `sub-${idx}`;
  };

  const buildSubjectPayload = () => {
    console.log("=== Building Subject Payload ===");
    console.log("subjectCatalog length:", subjectCatalog?.length || 0);
    console.log("staffSubjectKeys:", staffSubjectKeys);

    const selected = (subjectCatalog || [])
      .map((s: any, idx: number) => {
        const key = makeSubjectKey(s, idx);
        const isSelected = staffSubjectKeys.includes(key);

        if (isSelected) {
          console.log("Selected subject:", { key, subject: s });
        }

        if (!isSelected) return null;
        return { id: s.id, code: s.subject_code || s.course_code || s.code };
      })
      .filter(Boolean) as { id?: number; code?: string }[];

    const ids = Array.from(
      new Set(
        selected
          .map((x) => x.id)
          .filter((id): id is number => id !== undefined && id !== null),
      ),
    );
    const codes = Array.from(
      new Set(
        selected
          .map((x) => x.code)
          .filter((code): code is string => Boolean(code)),
      ),
    );

    const payload = { subject_ids: ids, subject_codes: codes };
    console.log("Final payload:", payload);
    console.log("=== End Subject Payload ===");

    return payload;
  };

  const handleToggleSubject = (key: string) => {
    console.log("Toggling subject key:", key);
    setStaffSubjectKeys((prev) => {
      const newKeys = prev.includes(key)
        ? prev.filter((s) => s !== key)
        : [...prev, key];
      console.log("Updated staffSubjectKeys:", newKeys);
      return newKeys;
    });
  };

  useEffect(() => {
    if (staffModalOpen && editingStaff) {
      api
        .get(`admin/staff/${editingStaff.id}/subjects`)
        .then((data: any) => {
          const payload = data?.data ?? data;
          const assignedIds = (payload?.subject_ids ??
            payload ??
            []) as number[];

          // Use IDs directly as keys (most stable approach)
          const matchingKeys = assignedIds
            .filter((id) => id !== undefined && id !== null)
            .map((id) => String(id));

          setStaffSubjectKeys(matchingKeys);
        })
        .catch((error) => {
          console.error("Failed to load staff subjects:", error);
          setStaffSubjectKeys([]);
        });
    } else if (staffModalOpen && !editingStaff) {
      setStaffSubjectKeys([]);
    }
  }, [staffModalOpen, editingStaff]);

  // Sync selectedRollNo with URL for spotlight search

  useEffect(() => {
    if (urlRollNo) {
      setSelectedRollNo(urlRollNo);
    }
  }, [urlRollNo]);

  const handleCloseProfile = () => {
    setSelectedRollNo(null);

    if (urlRollNo) {
      const params = new URLSearchParams(searchParams);

      params.delete("rollNo");

      setSearchParams(params);
    }
  };

  // Validation helper for staff form
  const validateStaffForm = (): string | null => {
    // Username validation (only for new staff)
    if (!editingStaff) {
      if (!staffForm.username || staffForm.username.trim().length < 3) {
        return "Username must be at least 3 characters";
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(staffForm.username)) {
        return "Username can only contain letters, numbers, dots, hyphens, and underscores";
      }
    }

    // Name validation
    if (!staffForm.name || staffForm.name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }

    // Email validation (optional but must be valid if provided)
    if (staffForm.email && staffForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffForm.email.trim())) {
        return "Please enter a valid email address";
      }
    }

    // Password validation (required for new staff)
    if (
      !editingStaff &&
      (!staffForm.password || staffForm.password.length < 6)
    ) {
      return "Password must be at least 6 characters";
    }

    // Password validation (optional for updates but must meet requirements if provided)
    if (editingStaff && staffForm.password && staffForm.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    return null; // No validation errors
  };

  const handleStaffSubmit = () => {
    // Validate form before submission
    const validationError = validateStaffForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (editingStaff) {
      updateStaffMutation.mutate({
        id: editingStaff.id,

        name: staffForm.name,

        email: staffForm.email || null,

        department: staffForm.department || null,

        password: staffForm.password || undefined,
      });
    } else {
      createStaffMutation.mutate({
        username: staffForm.username,

        password: staffForm.password || "password123",

        name: staffForm.name,

        email: staffForm.email || null,

        department: staffForm.department || null,
      });
    }
  };

  const handleDeleteStaff = () => {
    if (!staffToDelete) return;

    deleteStaffMutation.mutate(staffToDelete.id, {
      onSettled: () => setStaffToDelete(null),
    });
  };

  const { data, isLoading, refetch, isFetching } =
    useQuery<AdminCommandCenterResponse>({
      queryKey: ["admin-command-center"],

      queryFn: () => api.get("admin/command-center"),

      staleTime: 60_000,
    });

  const { data: riskRegistry } = useQuery<RiskRegistryResponse>({
    queryKey: ["admin-risk-registry", riskLevel],

    queryFn: () => api.get(`admin/risk/registry?level=${riskLevel}`),

    staleTime: 30_000,
  });

  const {
    data: staffDirectory,
    isLoading: loadingStaff,
    refetch: refetchStaff,
  } = useQuery<StaffProfile[]>({
    queryKey: ["admin-staff"],

    queryFn: () => api.get("admin/staff"),

    enabled: activeTab === "Staff" || activeTab === "Time Table",
  });

  // Timetable queries - fetch available batches, sections, and current timetable
  const { data: availableBatches } = useQuery({
    queryKey: ["admin-batches"],
    queryFn: () => api.get("admin/students/batches"),
    enabled: activeTab === "Time Table",
  });

  const { data: availableSections } = useQuery({
    queryKey: ["admin-sections"],
    queryFn: () => api.get("admin/students/sections"),
    enabled: activeTab === "Time Table",
  });

  const { data: availableTimetableSemesters } = useQuery({
    queryKey: ["admin-semesters"],
    queryFn: () => api.get("admin/students/semesters"),
    enabled: activeTab === "Time Table",
  });

  const { data: timetables, refetch: refetchTimetables } = useQuery<TimetableListResponse>({
    queryKey: ["admin-timetables", selectedBatch, selectedTimetableSemester],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
      if (selectedTimetableSemester) params.set('semester', selectedTimetableSemester);
      return api.get(`admin/timetables?${params.toString()}`);
    },
    enabled: activeTab === "Time Table" && !!selectedBatch,
  });

  const { data: subjects, error: subjectsError, isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin-subjects-for-timetable", selectedBatch, selectedTimetableSemester],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
      if (selectedTimetableSemester) params.set('semester', selectedTimetableSemester);
      console.log('[DEBUG] Fetching subjects with params:', params.toString());
      console.log('[DEBUG] selectedBatch:', selectedBatch, 'selectedTimetableSemester:', selectedTimetableSemester);
      return api.get(`admin/subjects?${params.toString()}`);
    },
    enabled: activeTab === "Time Table" && !!selectedCell && !!selectedBatch,
  });

  // Timetable mutations
  const createTimetableMutation = useMutation({
    mutationFn: (data: any) => api.post("admin/timetables", data),
    onSuccess: () => {
      setSelectedCell(null);
      refetchTimetables();
    },
    onError: (error: any) => {
      console.error("Error creating timetable:", error);
      alert(error.response?.data?.detail || "Failed to create timetable entry");
    }
  });

  const updateTimetableMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`admin/timetables/${id}`, data),
    onSuccess: () => {
      setSelectedCell(null);
      setEditingTimetable(null);
      refetchTimetables();
    },
    onError: (error: any) => {
      console.error("Error updating timetable:", error);
      alert(error.response?.data?.detail || "Failed to update timetable entry");
    }
  });

  const deleteTimetableMutation = useMutation({
    mutationFn: (id: number) => api.delete(`admin/timetables/${id}`),
    onSuccess: () => {
      refetchTimetables();
    },
    onError: (error: any) => {
      console.error("Error deleting timetable:", error);
      alert(error.response?.data?.detail || "Failed to delete timetable entry");
    }
  });

  const { data: studentDirectory, isFetching: isStudentsFetching } =
    useQuery<AdminDirectoryPage>({
      queryKey: [
        "admin-students-paginated",
        studentSearch,
        studentOffset,
        studentSemesterFilter,
        studentBatchFilter,
        studentSectionFilter,
        studentRiskOnly,
        studentSortBy,
        studentSortDir,
      ],

      queryFn: () =>
        api.get(
          `admin/students/paginated?limit=10&offset=${studentOffset}&sort_by=${studentSortBy}&sort_dir=${studentSortDir}${studentSearch ? `&search=${encodeURIComponent(studentSearch)}` : ""}${studentSemesterFilter !== "ALL" ? `&semester=${studentSemesterFilter}` : ""}${studentBatchFilter !== "ALL" ? `&batch=${encodeURIComponent(studentBatchFilter)}` : ""}${studentSectionFilter !== "ALL" ? `&section=${encodeURIComponent(studentSectionFilter)}` : ""}${studentRiskOnly ? "&risk_only=true" : ""}`,
        ),

      staleTime: 30_000,
    });

  const { data: leaderboard } = useQuery<SubjectLeaderboardResponse>({
    queryKey: ["admin-subject-leaderboard", selectedSubjectCode],

    queryFn: () => api.get(`admin/subject-leaderboard/${selectedSubjectCode}`),

    enabled: !!selectedSubjectCode,

    staleTime: 30_000,
  });

  // Subject catalog comes from the command-center bundle ÃÂ¢Ã¢–Â¬Ã¢–¬Â no separate request needed

  // Separate query for subject catalog to ensure it's available for staff modal
  const {
    data: subjectCatalogData,
    error: subjectCatalogError,
    isLoading: subjectCatalogLoading,
    refetch: refetchSubjects,
  } = useQuery<SubjectCatalogItem[]>({
    queryKey: ["admin-subject-catalog", studentBatchFilter, studentSectionFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (studentBatchFilter !== "ALL") {
        params.set("batch", studentBatchFilter);
      }
      if (studentSectionFilter !== "ALL") {
        params.set("section", studentSectionFilter);
      }
      const queryString = params.toString();
      return api.get(`admin/subject-catalog${queryString ? `?${queryString}` : ""}`);
    },
    staleTime: 5 * 60_000, // 5 minutes
    retry: 2, // Retry up to 2 times if endpoint fails
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const subjectCatalog = subjectCatalogData || data?.subject_catalog;

  // Debug logging for subject catalog
  console.log("Subject catalog debug:", {
    subjectCatalogData: subjectCatalogData?.length || 0,
    commandCenterData: data?.subject_catalog?.length || 0,
    finalCatalog: subjectCatalog?.length || 0,
    error: subjectCatalogError,
    loading: subjectCatalogLoading,
  });

  const semesterOptions = useMemo(() => {
    if (!subjectCatalog) return [];

    return Array.from(
      new Set(
        subjectCatalog
          .map((s) => s.semester)
          .filter((s): s is number => s != null && String(s) !== "0"),
      ),
    ).sort((a, b) => a - b);
  }, [subjectCatalog]);

  const filteredSubjects = useMemo(() => {
    if (!subjectCatalog) return [];

    if (selectedSemester === "ALL") return subjectCatalog;

    return subjectCatalog.filter(
      (s) => String(s.semester) === selectedSemester,
    );
  }, [subjectCatalog, selectedSemester]);

  useEffect(() => {
    if (filteredSubjects.length > 0 && !selectedSubjectCode) {
      setSelectedSubjectCode(filteredSubjects[0].subject_code);
    }
  }, [filteredSubjects, selectedSubjectCode]);

  const staffImpact = useMemo(() => {
    const items = data?.faculty_impact || [];

    const grouped: Record<
      number,
      { facultyName: string; subjects: FacultyImpactMatrixItem[] }
    > = {};

    items.forEach((item) => {
      if (!grouped[item.faculty_id])
        grouped[item.faculty_id] = {
          facultyName: item.faculty_name,
          subjects: [],
        };

      grouped[item.faculty_id].subjects.push(item);
    });

    return Object.entries(grouped).map(([id, payload]) => ({
      faculty_id: Number(id),

      faculty_name: payload.facultyName,

      subjects: payload.subjects,
    }));
  }, [data?.faculty_impact]);

  const filteredStaff = useMemo(() => {
    const list = staffDirectory || [];

    const term = staffSearch.trim().toLowerCase();

    if (!term) return list;

    return list.filter((s) => {
      const haystack =
        `${s.name || ""} ${s.username || ""} ${s.email || ""} ${s.department || ""}`.toLowerCase();

      return haystack.includes(term);
    });
  }, [staffDirectory, staffSearch]);

  // grade letter → 0-100 score (matches backend GRADE_POINT_CASE * 10)

  const gradeToScore = (grade?: string | null): number => {
    const g = (grade ?? "").toUpperCase();

    const map: Record<string, number> = {
      O: 100,
      S: 100,
      "A+": 90,
      A: 80,
      "B+": 70,
      B: 60,
      C: 50,
      D: 40,
      E: 30,
      P: 50,
      PASS: 50,
    };

    return map[g] ?? 0;
  };

  // Best available score: total_marks > internal_marks > grade-derived

  const bestScore = (s: {
    total_marks: number;
    internal_marks: number;
    grade?: string | null;
  }) =>
    s.total_marks > 0
      ? { value: s.total_marks, label: "marks" }
      : s.internal_marks > 0
        ? { value: s.internal_marks, label: "internals" }
        : { value: gradeToScore(s.grade), label: "grade pts" };

  const leaderboardSpread = useMemo(() => {
    if (!leaderboard) return [];

    return [
      ...leaderboard.top_leaderboard.map((s) => ({
        student: s.student_name.split(" ")[0],
        marks: bestScore(s).value,
      })),

      ...leaderboard.bottom_leaderboard.map((s) => ({
        student: s.student_name.split(" ")[0],
        marks: bestScore(s).value,
      })),
    ];
  }, [leaderboard]);

  const studentPageCount = studentDirectory
    ? Math.ceil(
        studentDirectory.pagination.total / studentDirectory.pagination.limit,
      )
    : 0;

  const currentStudentPage = studentDirectory
    ? Math.floor(
        studentDirectory.pagination.offset / studentDirectory.pagination.limit,
      ) + 1
    : 1;

  const batchOptions = useMemo(() => {
    if (!data?.batch_health) return [];

    return data.batch_health.map((b: any) => b.batch);
  }, [data?.batch_health]);

  const toggleSort = (field: "rank" | "name" | "roll_no" | "reg_no" | "gpa" | "attendance" | "backlogs") => {
    if (studentSortBy === field) {
      setStudentSortDir(studentSortDir === "asc" ? "desc" : "asc");
    } else {
      setStudentSortBy(field);

      setStudentSortDir("asc");
    }
  };

  // ── Metric drill-down state ────────────────────────────────────────────────
  const [drillDownMetric, setDrillDownMetric] = useState<MetricDetail | null>(null);

  // Helper to build details from live data
  const healthScore = data?.department_health.overall_health_score ?? 0;
  const activeStudents = data?.department_health.active_students ?? 0;
  const atRiskCount = data?.department_health.at_risk_count ?? 0;
  const averageGpa = data?.department_health.average_gpa ?? 0;
  const avgAttendance = data?.department_health.average_attendance ?? 0;
  const placementReady = data?.placement_summary.ready_count ?? 0;
  const placementAlmost = data?.placement_summary.almost_ready_count ?? 0;
  const placementBlocked = data?.placement_summary.blocked_count ?? 0;
  const avgCodingScore = data?.placement_summary.avg_coding_score ?? 0;

  const metricDetails: Record<string, MetricDetail> = {
    health: {
      title: "Department Health Score",
      value: `${healthScore}%`,
      icon: Activity,
      color: healthScore >= 75 ? "bg-emerald-600" : healthScore >= 50 ? "bg-amber-600" : "bg-rose-600",
      summary: `The Health Score is a composite percentage that reflects overall academic quality across all active students. A score of ${healthScore}% indicates ${
        healthScore >= 75 ? "a healthy department" : healthScore >= 50 ? "moderate concern" : "critical intervention required"
      }.`,
      formula: "Health Score = (Avg GPA / 10 × 50%) + (Avg Attendance × 50%)",
      sources: [
        { label: "Average GPA (CGPA)", value: `${averageGpa} / 10`, note: "Contributes 50% weight", status: averageGpa >= 7 ? "good" : averageGpa >= 5 ? "warn" : "bad" },
        { label: "Average Attendance", value: `${avgAttendance ?? 0}%`, note: "Contributes 50% weight", status: (avgAttendance ?? 0) >= 75 ? "good" : (avgAttendance ?? 0) >= 60 ? "warn" : "bad" },
        { label: "Active Students", value: String(activeStudents), note: "Population used in calculation", status: "neutral" },
        { label: "Students At Risk", value: String(atRiskCount), note: "Flagged for intervention", status: atRiskCount === 0 ? "good" : atRiskCount < 10 ? "warn" : "bad" },
      ],
      insights: [
        `${atRiskCount} student${atRiskCount !== 1 ? "s" : ""} are flagged as at-risk and pulling the score down.`,
        healthScore < 75 ? "Consider targeted interventions for low-GPA and low-attendance cohorts to improve the score." : "Score is healthy. Keep monitoring semester transitions.",
      ],
    },
    activeStudents: {
      title: "Active Student Population",
      value: String(activeStudents),
      icon: Users,
      color: "bg-blue-600",
      summary: `${activeStudents} students are currently enrolled and active in the system. This is the live headcount used across all metrics.`,
      sources: [
        { label: "Total Active Enrollments", value: String(activeStudents), status: "neutral" },
        { label: "Students At Risk", value: String(atRiskCount), note: `${activeStudents > 0 ? ((atRiskCount / activeStudents) * 100).toFixed(1) : 0}% of population`, status: atRiskCount === 0 ? "good" : "warn" },
        { label: "Placement Ready", value: String(placementReady), note: `${activeStudents > 0 ? ((placementReady / activeStudents) * 100).toFixed(1) : 0}% eligible`, status: "neutral" },
        ...(data?.batch_health?.map((b: any) => ({
          label: `Batch ${b.batch}`,
          value: `${b.student_count} students`,
          note: `GPA ${b.average_gpa} | Attn ${b.average_attendance}%`,
          status: (b.average_gpa >= 6 && b.average_attendance >= 75 ? "good" : b.average_gpa >= 5 ? "warn" : "bad") as "good" | "warn" | "bad" | "neutral",
        })) || []),
      ],
      insights: [
        `${activeStudents > 0 ? ((atRiskCount / activeStudents) * 100).toFixed(1) : 0}% of students are flagged at-risk — ${atRiskCount < activeStudents * 0.1 ? "within acceptable range" : "above the 10% threshold, action recommended"}.`,
        `${placementReady} out of ${activeStudents} students (${activeStudents > 0 ? ((placementReady / activeStudents) * 100).toFixed(1) : 0}%) are placement-ready.`,
      ],
    },
    atRisk: {
      title: "Students At Risk",
      value: String(atRiskCount),
      icon: ShieldAlert,
      color: atRiskCount === 0 ? "bg-emerald-600" : atRiskCount < 10 ? "bg-amber-600" : "bg-rose-600",
      summary: `${atRiskCount} students are flagged for academic intervention based on low GPA, poor attendance, or active backlogs. These students need immediate HOD attention.`,
      formula: "At Risk = GPA < 5.0 OR Attendance < 60% OR Active Backlogs > 0",
      sources: [
        { label: "Low GPA (< 5.0)", value: `${data?.risk_breakdown?.low_gpa ?? "—"} students`, status: "bad" },
        { label: "Low Attendance (< 60%)", value: `${data?.risk_breakdown?.low_attendance ?? "—"} students`, status: "warn" },
        { label: "Active Backlogs", value: `${data?.risk_breakdown?.backlogs ?? "—"} students`, status: "bad" },
        { label: "Overall At-Risk Count", value: String(atRiskCount), note: "Union of all risk signals", status: atRiskCount === 0 ? "good" : atRiskCount < 10 ? "warn" : "bad" },
        ...(data?.batch_health?.map((b: any) => ({
          label: `Batch ${b.batch} — at risk`,
          value: String(b.at_risk_count),
          note: `out of ${b.student_count} students`,
          status: (b.at_risk_count === 0 ? "good" : b.at_risk_count < 3 ? "warn" : "bad") as "good" | "warn" | "bad" | "neutral",
        })) || []),
      ],
      insights: [
        atRiskCount === 0
          ? "No at-risk students detected. Keep up the great work!"
          : `${atRiskCount} students require intervention. Check the Risk Radar tab for individual student profiles.`,
        "At-risk criteria: GPA below 5.0, attendance below 60%, or pending backlog papers.",
      ],
    },
    avgGpa: {
      title: "Average GPA (CGPA)",
      value: String(averageGpa),
      icon: Trophy,
      color: averageGpa >= 7 ? "bg-emerald-600" : averageGpa >= 5 ? "bg-amber-600" : "bg-rose-600",
      summary: `The department's average Cumulative Grade Point Average is ${averageGpa} out of 10. This is computed across all ${activeStudents} active students and all graded subjects.`,
      formula: "CGPA = Σ(Grade Points × Credit Hours) / Σ(Credit Hours) per student, then averaged",
      sources: [
        { label: "Department Avg CGPA", value: `${averageGpa} / 10`, status: averageGpa >= 7 ? "good" : averageGpa >= 5 ? "warn" : "bad" },
        { label: "Active Students", value: String(activeStudents), note: "Used in CGPA average", status: "neutral" },
        ...(data?.semester_pulse?.map((p: any) => ({
          label: `Semester ${p.semester}`,
          value: `${p.average_gpa} avg GPA`,
          note: `${p.student_count} students`,
          status: (p.average_gpa >= 7 ? "good" : p.average_gpa >= 5 ? "warn" : "bad") as "good" | "warn" | "bad" | "neutral",
        })) || []),
      ],
      insights: [
        `A CGPA of ${averageGpa} is ${averageGpa >= 7 ? "above" : averageGpa >= 5 ? "at" : "below"} industry expectations for placement readiness.`,
        "Hover over individual semester rows in the Semester Pulse section to compare cohort performance.",
      ],
    },
    placementReady: {
      title: "Placement Ready Students",
      value: String(placementReady),
      icon: BadgeCheck,
      color: "bg-emerald-600",
      summary: `${placementReady} students are fully eligible for campus placement drives. They meet minimum GPA, attendance, and backlog-free criteria.`,
      formula: "Ready = No active backlogs AND GPA ≥ 6.0 AND Attendance ≥ 75%",
      sources: [
        { label: "Drive Eligible", value: String(placementReady), note: "All criteria met", status: "good" },
        { label: "Almost Ready", value: String(placementAlmost), note: "1-2 criteria short", status: "warn" },
        { label: "Blocked", value: String(placementBlocked), note: "Arrears or low GPA", status: "bad" },
        { label: "Avg Coding Score", value: String(avgCodingScore), note: "Coding subject average", status: avgCodingScore >= 60 ? "good" : avgCodingScore >= 40 ? "warn" : "bad" },
      ],
      insights: [
        `${placementBlocked} students are blocked due to arrears or GPA issues — contact them for remedial action.`,
        `${placementAlmost} students are almost ready and could become eligible with focused effort this semester.`,
      ],
    },
    placementAlmost: {
      title: "Almost Ready for Placement",
      value: String(placementAlmost),
      icon: Target,
      color: "bg-amber-600",
      summary: `${placementAlmost} students are close to meeting placement eligibility. They fall short on one or two criteria and can be coached to readiness quickly.`,
      formula: "Almost = Missing 1–2 of: No backlogs / GPA ≥ 6.0 / Attendance ≥ 75%",
      sources: [
        { label: "Placement Ready", value: String(placementReady), note: "For context", status: "good" },
        { label: "Almost Ready", value: String(placementAlmost), note: "Primary metric", status: "warn" },
        { label: "Blocked", value: String(placementBlocked), status: "bad" },
        { label: "Total Active", value: String(activeStudents), status: "neutral" },
      ],
      insights: [
        `These ${placementAlmost} students are the highest-ROI group — a targeted intervention plan can flip them to 'Ready' before drives begin.`,
        "Check their individual profiles in the Students tab to identify which criterion they are missing.",
      ],
    },
    placementBlocked: {
      title: "Blocked from Placement",
      value: String(placementBlocked),
      icon: XCircle,
      color: "bg-rose-600",
      summary: `${placementBlocked} students are currently ineligible for placement drives due to active arrears, low GPA, or insufficient attendance.`,
      formula: "Blocked = Active backlogs > 0 OR GPA < 5.0 OR Attendance < 60%",
      sources: [
        { label: "Blocked Students", value: String(placementBlocked), note: "Cannot attend drives", status: "bad" },
        { label: "Almost Ready (can still improve)", value: String(placementAlmost), status: "warn" },
        { label: "Fully Eligible", value: String(placementReady), status: "good" },
      ],
      insights: [
        `Priority: Clear ${placementBlocked} blocked student${placementBlocked !== 1 ? "s" : ""} through backlog clearance programs and attendance improvement plans.`,
        "Each blocked student represents a missed opportunity — coordinate with semester coordinators.",
      ],
    },
    avgCoding: {
      title: "Average Coding Score",
      value: String(avgCodingScore),
      icon: Code2,
      color: avgCodingScore >= 60 ? "bg-blue-600" : avgCodingScore >= 40 ? "bg-amber-600" : "bg-rose-600",
      summary: `The department's average score in coding-related subjects is ${avgCodingScore}. This is used as a key placement readiness indicator.`,
      formula: "Avg Coding Score = Mean of all marks in subjects tagged as coding/programming",
      sources: [
        { label: "Avg Coding Score", value: String(avgCodingScore), note: "Across coding subjects", status: avgCodingScore >= 60 ? "good" : avgCodingScore >= 40 ? "warn" : "bad" },
        { label: "Placement Ready", value: String(placementReady), note: "Eligible students", status: "neutral" },
        { label: "Avg GPA", value: String(averageGpa), note: "For correlation", status: "neutral" },
      ],
      insights: [
        `Coding scores ${avgCodingScore >= 60 ? "are competitive" : "need improvement"} for industry placement standards.`,
        "Subjects contributing to this score can be viewed in the Subjects Management tab.",
      ],
    },
  };

  return (
    <div className="w-full pb-24 lg:pb-10">
      <MetricDrillDownModal detail={drillDownMetric} onClose={() => setDrillDownMetric(null)} />
      {activeTab !== "AI" && (
        <div className="-mx-1 mb-7 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex min-w-max px-1 border-b border-border/50">
            {[
              "Overview",
              "Performance",
              "Students",
              "Attendance",
              "Placements",
              "Time Table",
              "Security",
              "Profile",
              "Staff",
              "Subjects",
              "AI",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:content-[''] after:block"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Leaderboard" && (
        <LeaderboardView onSelectStudent={setSelectedRollNo} />
      )}

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <header className="hero-panel">
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                Enterprise Academic Intelligence
              </p>

              <h1 className="max-w-4xl text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
                SPARK Command Center
              </h1>

              <p className="max-w-3xl text-sm leading-6 text-slate-300 hidden sm:block">
                {data?.daily_briefing ||
                  "Aggregating ranking, placement, bottleneck, and faculty impact signals."}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button
                type="button"
                className="hero-button"
                onClick={() =>
                  exportWithToken(
                    "/admin/export/batch-summary",
                    "mca-batch-summary.xlsx",
                  )
                }
              >
                <Download size={16} />
                <span className="text-sm font-semibold">Export</span>
              </button>
            </div>
          </header>

          <section
            id="command-center"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-[1.75rem]" />
              ))
            ) : (
              <>
                <Metric
                  label="Health Score"
                  value={`${data?.department_health.overall_health_score ?? 0}%`}
                  hint="Composite of GPA + attendance."
                  icon={Activity}
                  color={healthScore >= 75 ? "emerald" : healthScore >= 50 ? "amber" : "rose"}
                  trend={healthScore >= 75 ? "up" : healthScore >= 50 ? "neutral" : "down"}
                  trendLabel={healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Moderate" : "Critical"}
                  onClick={() => setDrillDownMetric(metricDetails.health)}
                />

                <Metric
                  label="Active Students"
                  value={String(data?.department_health.active_students ?? 0)}
                  hint="Current enrolled population."
                  icon={Users}
                  color="blue"
                  onClick={() => setDrillDownMetric(metricDetails.activeStudents)}
                />

                <Metric
                  label="At Risk"
                  value={String(data?.department_health.at_risk_count ?? 0)}
                  hint="Flagged for intervention."
                  icon={ShieldAlert}
                  color={atRiskCount === 0 ? "emerald" : atRiskCount < 10 ? "amber" : "rose"}
                  trend={atRiskCount === 0 ? "up" : atRiskCount < 10 ? "neutral" : "down"}
                  trendLabel={atRiskCount === 0 ? "All clear" : atRiskCount < 10 ? "Moderate" : "High"}
                  onClick={() => setDrillDownMetric(metricDetails.atRisk)}
                />

                <Metric
                  label="Average GPA"
                  value={String(data?.department_health.average_gpa ?? 0)}
                  hint="Department CGPA out of 10."
                  icon={Trophy}
                  color={averageGpa >= 7 ? "emerald" : averageGpa >= 5 ? "amber" : "rose"}
                  trend={averageGpa >= 7 ? "up" : averageGpa >= 5 ? "neutral" : "down"}
                  trendLabel={`${averageGpa} / 10`}
                  onClick={() => setDrillDownMetric(metricDetails.avgGpa)}
                />
              </>
            )}
          </section>

          <section className="grid gap-4">
            <article id="placement-pipeline" className="panel overflow-hidden">
              <div className="mb-5 flex flex-col gap-3 border-b border-border/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Placement Pipeline
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Ready and blocked cohorts for recruiter planning.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Target size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Ready"
                  value={String(data?.placement_summary.ready_count ?? 0)}
                  hint="Drive eligible."
                  icon={BadgeCheck}
                  color="emerald"
                  trend="up"
                  trendLabel="Eligible"
                  onClick={() => setDrillDownMetric(metricDetails.placementReady)}
                />

                <Metric
                  label="Almost"
                  value={String(
                    data?.placement_summary.almost_ready_count ?? 0,
                  )}
                  hint="Near threshold."
                  icon={Target}
                  color="amber"
                  trend="neutral"
                  trendLabel="Close"
                  onClick={() => setDrillDownMetric(metricDetails.placementAlmost)}
                />

                <Metric
                  label="Blocked"
                  value={String(data?.placement_summary.blocked_count ?? 0)}
                  hint="Arrears/low GPA."
                  icon={XCircle}
                  color="rose"
                  trend="down"
                  trendLabel="Needs action"
                  onClick={() => setDrillDownMetric(metricDetails.placementBlocked)}
                />

                <Metric
                  label="Avg Code"
                  value={String(data?.placement_summary.avg_coding_score ?? 0)}
                  hint="Coding subject avg."
                  icon={Code2}
                  color={avgCodingScore >= 60 ? "blue" : avgCodingScore >= 40 ? "amber" : "rose"}
                  onClick={() => setDrillDownMetric(metricDetails.avgCoding)}
                />
              </div>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="panel">
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  HOD Action Queue
                </p>

                <p className="text-sm text-muted-foreground">
                  Critical interventions — tap any card to see full context.
                </p>
              </div>

              <div className="space-y-3">
                {data?.action_queue?.map(
                  (item: AdminCohortAction, i: number) => (
                    <ActionCard key={i} item={item} />
                  ),
                )}
                {!data?.action_queue?.length && (
                  <p className="text-sm text-muted-foreground text-center py-6">No pending actions.</p>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  Command Alerts
                </p>

                <p className="text-sm text-muted-foreground">
                  System anomalies — tap to understand the trigger.
                </p>
              </div>

              <div className="space-y-3">
                {data?.alerts?.map((alert: string, i: number) => (
                  <CommandAlertRow key={i} alert={alert} />
                ))}
                {!data?.alerts?.length && (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <p className="text-sm text-muted-foreground">No active alerts — all clear.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  Trendline Analysis
                </p>

                <p className="text-sm text-muted-foreground">
                  Overall department performance trajectory.
                </p>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height={192}>
                  <LineChart
                    data={
                      (data?.department_health?.semester_trends as any[]) || []
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                      vertical={false}
                    />

                    <XAxis dataKey="semester" hide />

                    <YAxis hide domain={["auto", "auto"]} />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="average_gpa"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="panel">
              <p className="text-lg font-semibold text-foreground">Batch Health</p>
              <p className="text-sm text-muted-foreground">Tap a batch for detailed breakdown.</p>
              <div className="mt-4 space-y-3">
                {data?.batch_health?.map((batch: any) => (
                  <BatchHealthRow key={batch.batch} batch={batch} deptAvgGpa={averageGpa} deptAvgAttn={avgAttendance} />
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="text-lg font-semibold text-foreground">Semester Pulse</p>
              <p className="text-sm text-muted-foreground">Tap a semester to see performance details.</p>
              <div className="mt-4 space-y-3">
                {data?.semester_pulse?.map((pulse: any) => (
                  <SemesterPulseRow key={pulse.semester} pulse={pulse} />
                ))}
              </div>
            </article>
          </section>

          {/* Faculty impact anchor for sidebar */}
          <section id="faculty-impact" className="panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Staff Impact Board</p>
                <p className="text-sm text-muted-foreground">Tap any faculty card for full performance analysis.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Briefcase size={16} className="text-primary" />
                <span>{data?.faculty_impact?.length || 0} entries</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.faculty_impact || [])
                .slice(0, 6)
                .map((item: FacultyImpactMatrixItem) => (
                  <FacultyCard key={`${item.faculty_id}-${item.subject_code}`} item={item} />
                ))}
              {(data?.faculty_impact?.length ?? 0) === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-8 text-center border border-dashed border-border/60 rounded-2xl">
                  <Activity size={20} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No staff metrics available yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "Performance" && (
        <div className="space-y-6">
          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">
                Hardest Subjects (Bottlenecks)
              </p>

              <p className="text-sm text-muted-foreground">
                Failure rates vs long-term averages.
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data?.bottlenecks || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="subject_name"
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fontSize: 10 }}
                    minTickGap={2}
                    tickFormatter={(value) =>
                      value.length > 25 ? `${value.substring(0, 22)}...` : value
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="failure_rate"
                    fill="var(--chart-3)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article id="leaderboard" className="panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Subject Leaderboard Engine
                </p>

                <p className="text-sm text-muted-foreground">
                  Comparative performance analysis by subject.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <select
                  className="input-field w-full !py-2 sm:w-40"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="ALL">All Semesters</option>

                  {semesterOptions.map((s) => (
                    <option key={s} value={String(s)}>
                      Sem {s}
                    </option>
                  ))}
                </select>

                <select
                  className="input-field w-full !py-2 sm:w-72"
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                >
                  {filteredSubjects.map((s) => (
                    <option key={s.subject_code} value={s.subject_code}>
                      {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Top Toppers
                </p>

                <div className="space-y-2">
                  {leaderboard?.top_leaderboard.map((e) => {
                    const { value, label } = bestScore(e);

                    return (
                      <button
                        key={e.roll_no}
                        onClick={() => setSelectedRollNo(e.roll_no)}
                        className="row-card w-full text-left"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {e.class_rank}
                            </span>
                            <p className="text-sm font-semibold">
                              {e.student_name}
                            </p>
                          </div>

                          {e.grade && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Grade: {e.grade}
                            </p>
                          )}
                        </div>

                        <span className="text-xs font-bold text-primary">
                          {value > 0 ? value : "\u2014"}{" "}
                          {value > 0 && (
                            <span className="font-normal text-muted-foreground">
                              {label}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Scoring Distribution
                </p>

                <div className="h-40">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={leaderboardSpread}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                      <XAxis dataKey="student" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="marks"
                        fill="var(--chart-2)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </article>

          <article className="panel">
            <p className="text-lg font-semibold text-foreground">
              Subject Coverage Map
            </p>

            <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
              {data?.subject_coverage?.map((item) => (
                <SubjectCoverageRow key={item.semester} item={item} />
              ))}
            </div>
          </article>
        </div>
      )}


      {/* ─── Add Student Modal ─────────────────────────────────────────────────── */}
      {addStudentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !createStudentMutation.isPending && setAddStudentOpen(false)}
        >
          <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <Users size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Student Management</p>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {addStudentResult ? "Student Created!" : "Add New Student"}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => !createStudentMutation.isPending && setAddStudentOpen(false)}
                className="mt-0.5 rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {addStudentResult ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground">{addStudentResult.name}</p>
                      <p className="text-sm text-muted-foreground">Student account created successfully</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Roll No", value: addStudentResult.roll_no },
                      { label: "Username", value: addStudentResult.username },
                      { label: "Initial Password", value: addStudentResult.initial_password },
                      { label: "Batch", value: addStudentResult.batch || "—" },
                      { label: "Section", value: addStudentResult.section || "—" },
                      { label: "Semester", value: addStudentResult.current_semester ? String(addStudentResult.current_semester) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/40">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`text-sm font-bold font-mono ${label === "Initial Password" ? "text-amber-500" : "text-foreground"}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <Zap size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Share the initial password with the student. They will be prompted to change it on first login.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddStudentResult(null);
                      setAddStudentForm({ roll_no: "", name: "", dob: "", email: "", batch: "", reg_no: "", section: "", current_semester: "" });
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Add Another Student
                  </button>
                </div>
              ) : (
                /* Form state */
                <div className="space-y-4">
                  {addStudentError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                      <XCircle size={15} className="shrink-0" />
                      {addStudentError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Full Name *</label>
                      <input
                        value={addStudentForm.name}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Priya Sharma"
                        className="input-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Roll No *</label>
                      <input
                        value={addStudentForm.roll_no}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, roll_no: e.target.value }))}
                        placeholder="e.g. 23MCA001"
                        className="input-field w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Reg No</label>
                      <input
                        value={addStudentForm.reg_no}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, reg_no: e.target.value }))}
                        placeholder="e.g. REG20230001"
                        className="input-field w-full font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                        Date of Birth * <span className="text-amber-500 normal-case font-normal">(used as initial password DDMMYYYY)</span>
                      </label>
                      <input
                        type="date"
                        value={addStudentForm.dob}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, dob: e.target.value }))}
                        className="input-field w-full"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={addStudentForm.email}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="e.g. priya@college.edu"
                        className="input-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Batch</label>
                      <input
                        value={addStudentForm.batch}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, batch: e.target.value }))}
                        placeholder="e.g. 2023-2025"
                        className="input-field w-full"
                        list="batch-suggestions"
                      />
                      <datalist id="batch-suggestions">
                        {batchOptions.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Section</label>
                      <select
                        value={addStudentForm.section}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, section: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Current Semester</label>
                      <select
                        value={addStudentForm.current_semester}
                        onChange={(e) => setAddStudentForm((f) => ({ ...f, current_semester: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!addStudentResult && (
              <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between shrink-0">
                <p className="text-xs text-muted-foreground">* Required fields</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddStudentOpen(false)}
                    disabled={createStudentMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold border border-border/60 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={createStudentMutation.isPending || !addStudentForm.roll_no.trim() || !addStudentForm.name.trim() || !addStudentForm.dob}
                    onClick={() => {
                      setAddStudentError("");
                      const payload: any = {
                        roll_no: addStudentForm.roll_no.trim(),
                        name: addStudentForm.name.trim(),
                        dob: addStudentForm.dob,
                      };
                      if (addStudentForm.email.trim()) payload.email = addStudentForm.email.trim();
                      if (addStudentForm.batch.trim()) payload.batch = addStudentForm.batch.trim();
                      if (addStudentForm.reg_no.trim()) payload.reg_no = addStudentForm.reg_no.trim();
                      if (addStudentForm.section) payload.section = addStudentForm.section;
                      if (addStudentForm.current_semester) payload.current_semester = parseInt(addStudentForm.current_semester);
                      createStudentMutation.mutate(payload);
                    }}
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                  >
                    {createStudentMutation.isPending ? (
                      <><RefreshCw size={14} className="animate-spin" /> Creating...</>
                    ) : (
                      <><Plus size={14} /> Create Student</>
                    )}
                  </button>
                </div>
              </div>
            )}
            {addStudentResult && (
              <div className="px-6 py-4 border-t border-border/50 flex justify-end shrink-0">
                <button
                  onClick={() => setAddStudentOpen(false)}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Add Batch Modal ──────────────────────────────────────────────────── */}
      {addBatchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setAddBatchOpen(false)}
        >
          <div className="relative w-full sm:max-w-md bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <ArrowUp size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Batch Management</p>
                  <h2 className="text-xl font-bold text-white leading-tight">Add New Batch</h2>
                </div>
              </div>
              <button onClick={() => setAddBatchOpen(false)} className="mt-0.5 rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {addBatchError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                  <XCircle size={15} className="shrink-0" />
                  {addBatchError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Batch Identifier *</label>
                <input
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g. 2024-2026 or 2023-25"
                  className="input-field w-full text-lg font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Use a year-range format like <code className="font-mono bg-muted/40 px-1 rounded">2023-2025</code>. This becomes the batch label for students.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">What happens next?</p>
                <p className="text-sm text-muted-foreground">
                  The batch label will be available when adding students. You can then filter and manage students by this batch in the directory.
                </p>
              </div>

              {batchOptions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-2">Existing Batches</p>
                  <div className="flex flex-wrap gap-2">
                    {batchOptions.map((b) => (
                      <span key={b} className="px-2.5 py-1 rounded-full bg-muted/30 border border-border/40 text-xs font-mono text-muted-foreground">{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between shrink-0">
              <p className="text-xs text-muted-foreground">The batch is stored with student records</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddBatchOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border/60 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!newBatchName.trim()}
                  onClick={() => {
                    const trimmed = newBatchName.trim();
                    if (!trimmed) {
                      setAddBatchError("Batch name cannot be empty");
                      return;
                    }
                    if (batchOptions.includes(trimmed)) {
                      setAddBatchError(`Batch "${trimmed}" already exists`);
                      return;
                    }
                    // Batch is a label—open Add Student modal pre-filled with this batch
                    setAddBatchOpen(false);
                    setAddStudentOpen(true);
                    setAddStudentForm({
                      roll_no: "",
                      name: "",
                      dob: "",
                      email: "",
                      batch: trimmed,
                      reg_no: "",
                      section: "",
                      current_semester: "",
                    });
                    setAddStudentResult(null);
                    setAddStudentError("");
                  }}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create & Add Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Students" && (
        <div className="space-y-5">
          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-1">Management</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Student Directory</h2>
              <p className="mt-1 text-sm text-muted-foreground">Full cohort directory with advanced sorting and batch filters.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setAddBatchOpen(true);
                  setNewBatchName("");
                  setAddBatchError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/50 hover:border-primary/30 transition-all"
                title="Add a new batch"
              >
                <Plus size={14} />
                Add Batch
              </button>
              <button
                onClick={() => {
                  setAddStudentOpen(true);
                  setAddStudentForm({
                    roll_no: "",
                    name: "",
                    dob: "",
                    email: "",
                    batch: studentBatchFilter !== "ALL" ? studentBatchFilter : "",
                    reg_no: "",
                    section: studentSectionFilter !== "ALL" ? studentSectionFilter : "",
                    current_semester: "",
                  });
                  setAddStudentResult(null);
                  setAddStudentError("");
                }}
                className="btn-primary"
                title="Add a new student"
              >
                <Plus size={14} />
                Add Student
              </button>
            </div>
          </div>

          <article className="panel !p-0 overflow-hidden">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-border/50 bg-muted/20">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/80 py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground"
                  placeholder="Search name, roll, email…"
                />
              </div>

              <select
                className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                value={studentBatchFilter}
                onChange={(e) => setStudentBatchFilter(e.target.value)}
              >
                <option value="ALL">All Batches</option>
                {batchOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                value={studentSemesterFilter}
                onChange={(e) => setStudentSemesterFilter(e.target.value)}
              >
                <option value="ALL">All Semesters</option>
                {semesterOptions.map((s) => (
                  <option key={s} value={String(s)}>Sem {s}</option>
                ))}
              </select>

              <select
                className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                value={studentSectionFilter}
                onChange={(e) => setStudentSectionFilter(e.target.value)}
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>

              <button
                onClick={() => setStudentRiskOnly(!studentRiskOnly)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold border transition-all ${
                  studentRiskOnly
                    ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                    : "border-border/60 bg-card/80 text-muted-foreground hover:border-rose-300 hover:text-rose-600"
                }`}
              >
                <ShieldAlert size={13} />
                At Risk
              </button>

              <div className="ml-auto">
                <button
                  onClick={() => {
                    const batch = studentBatchFilter !== "ALL" ? studentBatchFilter : "2025-2027";
                    assignSectionsMutation.mutate(batch);
                  }}
                  disabled={assignSectionsMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-40 transition-all"
                  title="Assign Sections A and B"
                >
                  {assignSectionsMutation.isPending ? "Assigning…" : "Assign Sections"}
                </button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {[
                      { key: "rank",       label: "Rank" },
                      { key: "name",       label: "Name" },
                      { key: "roll_no",    label: "Roll No" },
                      { key: "reg_no",     label: "Reg No" },
                      { key: "batch",      label: "Batch" },
                      { key: "section",    label: "Sec" },
                      { key: "sem",        label: "Sem" },
                      { key: "gpa",        label: "GPA" },
                      { key: "attendance", label: "Attendance" },
                      { key: "backlogs",   label: "Backlogs" },
                    ].map((col) => (
                      <th key={col.key} className="px-5 py-3.5 text-left">
                        <button
                          onClick={() =>
                            ["rank", "name", "roll_no", "reg_no", "gpa", "attendance", "backlogs"].includes(col.key) &&
                            toggleSort(col.key as any)
                          }
                          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            ["rank", "name", "roll_no", "reg_no", "gpa", "attendance", "backlogs"].includes(col.key)
                              ? "text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              : "text-muted-foreground/60 cursor-default"
                          }`}
                        >
                          {col.label}
                          {studentSortBy === col.key && (
                            <span className="text-primary ml-0.5">{studentSortDir === "asc" ? "↑" : "↓"}</span>
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/30">
                  {isStudentsFetching
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={10} className="px-5 py-4">
                            <div className="skeleton h-9 w-full rounded-xl" />
                          </td>
                        </tr>
                      ))
                    : studentDirectory?.items.map((item) => {
                        const gpa = Number(item.average_grade_points);
                        const attn = Number(item.attendance_percentage);
                        const gpaColor = gpa >= 8 ? "text-emerald-600" : gpa >= 6 ? "text-foreground" : gpa >= 5 ? "text-amber-600" : "text-rose-600";
                        const attnColor = attn >= 75 ? "text-emerald-600" : attn >= 65 ? "text-amber-600" : "text-rose-600";
                        return (
                          <tr
                            key={item.roll_no}
                            className="group hover:bg-muted/25 transition-colors duration-150"
                          >
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-primary/8 text-[11px] font-black text-primary font-mono">
                                #{item.rank || "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <button
                                onClick={() => setSelectedRollNo(item.roll_no)}
                                className="flex items-center gap-3 text-left"
                              >
                                <StudentAvatar id={item.id} name={item.name} rollNo={item.roll_no} size="h-9 w-9 text-xs font-bold" />
                                <div>
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                                    {item.email?.split("@")[0]}
                                  </p>
                                </div>
                              </button>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-muted-foreground">{item.roll_no}</span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-muted-foreground">
                                {item.reg_no || <span className="opacity-30">—</span>}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/15">
                                {item.batch}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                                {item.section || "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-muted-foreground">
                              Sem {item.current_semester}
                            </td>

                            <td className="px-5 py-4">
                              <span className={`text-sm font-bold tabular-nums ${gpaColor}`}>
                                {gpa.toFixed(2)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold tabular-nums ${attnColor}`}>
                                  {attn.toFixed(1)}%
                                </span>
                                <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${attn >= 75 ? "bg-emerald-500" : attn >= 65 ? "bg-amber-500" : "bg-rose-500"}`}
                                    style={{ width: `${Math.min(attn, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {item.backlogs > 0 ? (
                                <span className="inline-flex items-center rounded-lg bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-500/20">
                                  {item.backlogs} backlog{item.backlogs !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-lg bg-emerald-500/8 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                                  Clear
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="grid gap-3 p-4 sm:hidden">
              {isStudentsFetching
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 rounded-2xl" />
                  ))
                : studentDirectory?.items.map((item) => (
                    <button
                      key={`m-${item.roll_no}`}
                      onClick={() => setSelectedRollNo(item.roll_no)}
                      className="row-card w-full text-left group flex items-center gap-3"
                    >
                      <StudentAvatar id={item.id} name={item.name} rollNo={item.roll_no} size="h-10 w-10 text-sm font-bold" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">#{item.rank || "-"}</span>
                          <p className="truncate font-semibold group-hover:text-primary transition-colors">{item.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.roll_no} · Sem {item.current_semester} ·{" "}
                          <span className="rounded-md bg-primary/8 text-primary px-1.5 py-0.5 text-[10px] font-bold">{item.batch}</span>
                          {item.section ? ` · Sec ${item.section}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                        <span className={`font-bold tabular-nums ${Number(item.average_grade_points) >= 7 ? "text-emerald-600" : Number(item.average_grade_points) >= 5 ? "text-amber-600" : "text-rose-600"}`}>
                          {Number(item.average_grade_points).toFixed(2)} GPA
                        </span>
                        <span className={`font-medium tabular-nums ${item.attendance_percentage < 75 ? "text-rose-500" : "text-emerald-500"}`}>
                          {Number(item.attendance_percentage).toFixed(1)}% Attn
                        </span>
                        {item.backlogs > 0 && (
                          <span className="font-bold text-rose-500">{item.backlogs} backlogs</span>
                        )}
                      </div>
                    </button>
                  ))}
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{studentDirectory?.items.length || 0}</span> of{" "}
                <span className="font-semibold text-foreground">{studentDirectory?.pagination.total || 0}</span> students
              </p>
              <div className="flex gap-2">
                <button
                  disabled={studentOffset === 0}
                  onClick={() => setStudentOffset((o) => Math.max(0, o - 10))}
                  className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  disabled={!studentDirectory || studentOffset + 10 >= studentDirectory.pagination.total}
                  onClick={() => setStudentOffset((o) => o + 10)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {activeTab === "Security" && (
        <div className="space-y-6">
          <article className="panel">
            <div className="mb-6">
              <p className="text-lg font-semibold text-foreground">
                Security & Access
              </p>

              <p className="text-sm text-muted-foreground">
                Monitor system access, initial password status, and account
                security.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-6">
                <p className="text-sm font-bold text-foreground mb-4">
                  Initial Passwords
                </p>

                <div className="space-y-3">
                  {studentDirectory?.items
                    .filter((s) => s.is_initial_password)
                    .slice(0, 5)
                    .map((s) => (
                      <div
                        key={s.roll_no}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground">
                          {s.roll_no}
                        </span>

                        <span className="text-rose-500 font-bold">
                          Unchanged
                        </span>
                      </div>
                    ))}
                </div>

                <p className="mt-6 text-[10px] text-muted-foreground uppercase tracking-widest">
                  Action recommended for{" "}
                  {studentDirectory?.items.filter((s) => s.is_initial_password)
                    .length || 0}{" "}
                  students
                </p>
              </div>
            </div>
          </article>
        </div>
      )}

      {activeTab === "Profile" && renderProfileTab()}
      {activeTab === "Risk" && (
        <RiskRadarView onOpenStudentProfile={setSelectedRollNo} />
      )}

      {activeTab === "Placements" && (
        <PlacementView onOpenStudentProfile={setSelectedRollNo} />
      )}

      {activeTab === "Time Table" && (
        <div className="space-y-6">
          <article className="panel">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Timetable Management
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select batch and click on time slots to assign subjects and staff.
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Batch</label>
                    <select 
                      className="input w-full"
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                      <option value="">Select Batch</option>
                      {availableBatches?.map((batch: string) => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Semester</label>
                    <select 
                      className="input w-full"
                      value={selectedTimetableSemester}
                      onChange={(e) => setSelectedTimetableSemester(e.target.value)}
                    >
                      <option value="">Select Semester</option>
                      {availableTimetableSemesters?.map((semester: number) => (
                        <option key={semester} value={semester}>Semester {semester}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Sections</label>
                    <div className="flex gap-2 items-center h-10">
                      {availableSections?.map((section: string) => (
                        <span key={section} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Grid */}
            {selectedBatch && selectedTimetableSemester ? (
              <div className="overflow-x-auto border rounded-xl custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold w-20">
                        Day
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        1<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          9:15-10:05
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        2<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          10:05-10:55
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        3<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          11:10-12:00
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        4<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          12:00-12:50
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold bg-slate-50 dark:bg-slate-900/20 text-foreground min-w-20">
                        LUNCH<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          12:50-1:30
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        5<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          1:30-2:20
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        6<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          2:20-3:10
                        </span>
                      </th>
                      <th className="border border-border p-3 text-center font-semibold min-w-20">
                        7<br/>
                        <span className="text-xs font-normal text-muted-foreground">
                          3:10-4:00
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Monday", day: 1 },
                      { name: "Tuesday", day: 2 },
                      { name: "Wednesday", day: 3 },
                      { name: "Thursday", day: 4 },
                      { name: "Friday", day: 5 },
                      { name: "Saturday", day: 6 }
                    ].map(({ name, day }) => (
                      <tr key={name}>
                        <td className="border border-border p-3 font-semibold bg-muted/30">
                          {name}
                        </td>
                        {[1, 2, 3, 4].map((period) => {
                          const existingSlots = timetables?.items?.filter(
                            item => item.day_of_week === day && item.period === period
                          ) || [];
                          
                          return (
                            <td 
                              key={`${day}-${period}`}
                              className="border border-border p-2 cursor-pointer hover:bg-muted/20 min-h-16 align-top"
                              onClick={() => setSelectedCell({ day, period })}
                              title="Click to assign subjects"
                            >
                              <div className="space-y-1">
                                {existingSlots.map((slot, idx) => (
                                  <div key={idx} className="text-xs group/slot relative bg-muted/40 p-1.5 rounded-lg border border-border/50">
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="font-bold text-primary flex-1">
                                        {slot.section}: {slot.subject_name || slot.subject_code || 'Break'}
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTimetable(slot);
                                            setSelectedCell({ day: slot.day_of_week, period: slot.period });
                                          }}
                                          className="p-1 hover:text-blue-600 transition-colors"
                                          title="Edit Slot"
                                        >
                                          <Edit size={12} />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this timetable slot?')) {
                                              deleteTimetableMutation.mutate(slot.id);
                                            }
                                          }}
                                          className="p-1 hover:text-rose-600 transition-colors"
                                          title="Delete Slot"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    {slot.faculty_name && (
                                      <div className="text-[10px] text-muted-foreground truncate italic">
                                        {slot.faculty_name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {existingSlots.length === 0 && (
                                  <div className="text-xs text-muted-foreground italic p-1">
                                    Click to add
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        
                        {/* Lunch Break */}
                        <td className="border border-border p-3 text-center bg-slate-50/50 dark:bg-slate-900/10 text-muted-foreground">
                          LUNCH BREAK
                        </td>
                        
                        {[5, 6, 7].map((period) => {
                          const existingSlots = timetables?.items?.filter(
                            item => item.day_of_week === day && item.period === period
                          ) || [];
                          
                          return (
                            <td 
                              key={`${day}-${period}`}
                              className="border border-border p-2 cursor-pointer hover:bg-muted/20 min-h-16 align-top"
                              onClick={() => setSelectedCell({ day, period })}
                              title="Click to assign subjects"
                            >
                              <div className="space-y-1">
                                {existingSlots.map((slot, idx) => (
                                  <div key={idx} className="text-xs group/slot relative bg-muted/40 p-1.5 rounded-lg border border-border/50">
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="font-bold text-primary flex-1">
                                        {slot.section}: {slot.subject_name || slot.subject_code || 'Break'}
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTimetable(slot);
                                            setSelectedCell({ day: slot.day_of_week, period: slot.period });
                                          }}
                                          className="p-1 hover:text-blue-600 transition-colors"
                                          title="Edit Slot"
                                        >
                                          <Edit size={12} />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this timetable slot?')) {
                                              deleteTimetableMutation.mutate(slot.id);
                                            }
                                          }}
                                          className="p-1 hover:text-rose-600 transition-colors"
                                          title="Delete Slot"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    {slot.faculty_name && (
                                      <div className="text-[10px] text-muted-foreground truncate italic">
                                        {slot.faculty_name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {existingSlots.length === 0 && (
                                  <div className="text-xs text-muted-foreground italic p-1">
                                    Click to add
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="space-y-2">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <p className="text-lg font-medium">Select a Batch</p>
                  <p className="text-sm">
                    Choose a batch from the dropdown above to view and edit the timetable.
                  </p>
                </div>
              </div>
            )}
          </article>

          {/* Section Selection Modal */}
          {selectedCell && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
              onClick={(e) => e.target === e.currentTarget && (setSelectedCell(null), setEditingTimetable(null))}
            >
              <div className="bg-background border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-semibold mb-4">
                  {editingTimetable ? "Edit Slot" : "Assign Subject"} - {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedCell.day]} Period {selectedCell.period}
                </h3>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const payload = {
                    batch: selectedBatch,
                    section: formData.get('section') as string,
                    day_of_week: selectedCell.day,
                    period: selectedCell.period,
                    subject_id: formData.get('subject_id') ? parseInt(formData.get('subject_id') as string) : null,
                    faculty_id: formData.get('faculty_id') ? parseInt(formData.get('faculty_id') as string) : null,
                    room_number: null,
                    academic_year: "2024-25",
                    semester: parseInt(selectedTimetableSemester)
                  };
                  
                  if (editingTimetable) {
                    updateTimetableMutation.mutate({ id: editingTimetable.id, data: payload });
                  } else {
                    createTimetableMutation.mutate(payload);
                  }
                }} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Section *</label>
                    <select 
                      name="section" 
                      className="input w-full" 
                      required
                      defaultValue={editingTimetable?.section || ""}
                    >
                      <option value="">Select Section</option>
                      {availableSections?.map((section: string) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <select 
                      name="subject_id" 
                      className="input w-full"
                      defaultValue={editingTimetable?.subject_id || ""}
                    >
                      <option value="">No Subject (Break)</option>
                      {subjectsLoading && <option disabled>Loading subjects...</option>}
                      {subjectsError && <option disabled>Error loading subjects</option>}
                      {subjects?.map((subject: any) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.course_code || subject.code} - {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Faculty *</label>
                    <select 
                      name="faculty_id" 
                      className="input w-full" 
                      required
                      defaultValue={editingTimetable?.faculty_id || ""}
                    >
                      <option value="">Select Faculty</option>
                      {staffDirectory?.map((staff: any) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      className="btn-ghost flex-1"
                      onClick={() => {
                        setSelectedCell(null);
                        setEditingTimetable(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={createTimetableMutation.isPending || updateTimetableMutation.isPending}
                    >
                      {editingTimetable 
                        ? (updateTimetableMutation.isPending ? "Updating..." : "Update Slot")
                        : (createTimetableMutation.isPending ? "Adding..." : "Add Slot")
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Staff" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">Staff</p>

              <p className="text-sm text-muted-foreground">
                Manage faculty access and profiles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="input-field !py-2 w-56"
                placeholder="Search name, username, dept"
              />

              <button
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => {
                  setEditingStaff(null);

                  setStaffForm({
                    username: "",
                    name: "",
                    email: "",
                    department: "",
                    password: "password123",
                  });

                  setStaffModalOpen(true);
                }}
              >
                <Plus size={16} />
                Add Staff
              </button>
            </div>
          </div>

          {/* Mobile staff cards */}
          <div className="grid gap-3 sm:hidden">
            {(filteredStaff || []).map((s) => (
              <div key={s.id} className="row-card flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {s.name?.slice(0, 1) || s.username.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{s.name || s.username}</p>
                  <p className="text-xs text-muted-foreground">{s.email || "No email"}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.subjects?.slice(0, 3).map((sub) => (
                      <span key={sub.code} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold">{sub.code}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    className="tab-chip !py-1 !px-2 text-xs"
                    onClick={() => {
                      setEditingStaff(s);
                      setStaffForm({ username: s.username, name: s.name, email: s.email || "", department: s.department || "", password: "" });
                      setStaffModalOpen(true);
                    }}
                  >Edit</button>
                  <button
                    className="tab-chip !py-1 !px-2 text-xs !bg-rose-500/10 !text-rose-600"
                    onClick={() => setStaffToDelete(s)}
                  >Del</button>
                </div>
              </div>
            ))}
          </div>

          <article className="panel space-y-3 hidden sm:block">
            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Staff</th>

                    <th className="px-4 py-3 text-left">Username / Dept</th>

                    <th className="px-4 py-3 text-left">Email</th>

                    <th className="px-4 py-3 text-left">Subjects</th>

                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {(filteredStaff || []).map((s) => {
                    // Use actual staff subject assignments instead of impact data

                    return (
                      <tr
                        key={s.id}
                        className="border-t border-border/40 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {s.name?.slice(0, 1) || s.username.slice(0, 1)}
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">
                                {s.name || "ÃÂ¯ÃÂ¿ÃÂ½"}
                              </p>

                              <p className="text-[11px] text-muted-foreground">
                                ID: {s.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="font-mono text-xs text-foreground">
                            {s.username}
                          </div>

                          <div className="text-xs">
                            {s.department || "Dept NA"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {s.email || "No email"}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {s.subjects?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {s.subjects.slice(0, 3).map((sub) => (
                                <span
                                  key={sub.code}
                                  className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold"
                                >
                                  {sub.code}
                                </span>
                              ))}

                              {s.subjects.length > 3 && (
                                <span className="text-[10px] text-foreground">
                                  +{s.subjects.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px]">No subjects</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="tab-chip"
                              onClick={() => {
                                setEditingStaff(s);

                                setStaffForm({
                                  username: s.username,

                                  name: s.name,

                                  email: s.email || "",

                                  department: s.department || "",

                                  password: "",
                                });

                                setStaffModalOpen(true);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="tab-chip !bg-rose-500/10 !text-rose-600 hover:!bg-rose-500/20"
                              onClick={() => setStaffToDelete(s)}
                              disabled={deleteStaffMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {loadingStaff && (
                    <tr>
                      <td
                        className="px-4 py-4 text-sm text-muted-foreground"
                        colSpan={5}
                      >
                        Loading staff...
                      </td>
                    </tr>
                  )}

                  {!loadingStaff && filteredStaff.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-4 text-sm text-muted-foreground"
                        colSpan={5}
                      >
                        No staff match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {activeTab === "Attendance" && (
        <div className="space-y-6">
          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">Batch Attendance Overview</p>
              <p className="text-sm text-muted-foreground">Average attendance percentage by batch — tap to see details.</p>
            </div>
            <div className="grid gap-3">
              {data?.batch_health?.map((batch: any) => (
                <AttendanceBatchRow key={batch.batch} batch={batch} />
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">Semester Attendance Trends</p>
              <p className="text-sm text-muted-foreground">Attendance performance by semester.</p>
            </div>
            {data?.semester_pulse && data.semester_pulse.length > 0 ? (
              <div className="grid gap-3">
                {data.semester_pulse.map((pulse: any, idx: number) => (
                  <AttendanceSemesterRow key={idx} pulse={pulse} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No semester attendance data available.</p>
            )}
          </article>

          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">Attendance Summary</p>
              <p className="text-sm text-muted-foreground">Department-wide attendance metrics.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 p-4 rounded-xl bg-muted/10 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg Attendance</p>
                <p className={`text-3xl font-black ${
                  (data?.department_health?.average_attendance ?? 0) >= 75 ? "text-emerald-600" :
                  (data?.department_health?.average_attendance ?? 0) >= 60 ? "text-amber-600" : "text-rose-600"
                }`}>{data?.department_health?.average_attendance ?? 0}%</p>
              </div>
              <div className="space-y-1 p-4 rounded-xl bg-muted/10 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Students</p>
                <p className="text-3xl font-black text-foreground">{data?.department_health?.active_students ?? 0}</p>
              </div>
              <div className="space-y-1 p-4 rounded-xl bg-muted/10 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">At Risk</p>
                <p className="text-3xl font-black text-rose-600">{data?.department_health?.at_risk_count ?? 0}</p>
              </div>
            </div>
          </article>
        </div>
      )}

      {staffModalOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStaffModalOpen(false);
              setEditingStaff(null);
              setStaffForm({
                username: "",
                name: "",
                email: "",
                department: "",
                password: "password123",
              });
            }
          }}
        >
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/40 flex items-start justify-between gap-3 shrink-0">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {editingStaff ? "Edit Staff" : "Add Staff"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Create or update staff login and profile.
                </p>
              </div>
              <button
                aria-label="Close"
                className="tab-chip"
                onClick={() => {
                  setStaffModalOpen(false);
                  setEditingStaff(null);
                  setStaffForm({
                    username: "",
                    name: "",
                    email: "",
                    department: "",
                    password: "password123",
                  });
                }}
              >
                Close
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">

            <div className="grid gap-3">
              {!editingStaff && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Username
                  </p>
                  <input
                    className="input-field w-full"
                    value={staffForm.username}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, username: e.target.value })
                    }
                    placeholder="e.g., staff01"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Name
                </p>
                <input
                  className="input-field w-full"
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, name: e.target.value })
                  }
                  placeholder="Full name"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </p>
                <input
                  className="input-field w-full"
                  value={staffForm.email}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, email: e.target.value })
                  }
                  placeholder="name@college.edu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Department
                  </p>
                  <input
                    className="input-field w-full"
                    value={staffForm.department}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, department: e.target.value })
                    }
                    placeholder="MCA"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Password
                  </p>
                  <input
                    type="password"
                    className="input-field w-full"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, password: e.target.value })
                    }
                    placeholder={
                      editingStaff
                        ? "Leave blank to keep"
                        : "Set initial password"
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Subjects
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Select subjects to assign to this staff member.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input-field w-full sm:w-64 text-xs"
                    placeholder="Search subject code or name"
                    value={staffSubjectSearch}
                    onChange={(e) => setStaffSubjectSearch(e.target.value)}
                  />
                  <select
                    className="input-field w-32 text-xs"
                    value={
                      staffSubjectSemFilter === "ALL"
                        ? "ALL"
                        : String(staffSubjectSemFilter)
                    }
                    onChange={(e) =>
                      setStaffSubjectSemFilter(
                        e.target.value === "ALL"
                          ? "ALL"
                          : Number(e.target.value),
                      )
                    }
                  >
                    <option value="ALL">All Sem</option>
                    {Array.from(
                      new Set(
                        (subjectCatalog || [])
                          .map((s: any) => s.semester)
                          .filter((s) => Boolean(s) && String(s) !== "0"),
                      ),
                    )
                      .sort((a, b) => Number(a) - Number(b))
                      .map((sem) => (
                        <option key={sem} value={String(sem)}>
                          Sem {sem}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-xl border border-border/50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const allSubjects = subjectCatalog || [];
                    console.log("=== Subject Display Debug ===");
                    console.log("Raw subjectCatalog:", allSubjects);
                    console.log(
                      "Total subjects before filter:",
                      allSubjects.length,
                    );
                    console.log(
                      "staffSubjectSemFilter:",
                      staffSubjectSemFilter,
                    );
                    console.log("staffSubjectSearch:", staffSubjectSearch);

                    const filtered = allSubjects.filter((s: any) => {
                      // Filter out GEN_ATT (attendance-only) subjects
                      const isGraded = isGradedSubject(s);
                      if (!isGraded) {
                        console.log("Filtered out non-graded subject:", s);
                        return false;
                      }

                      const term = staffSubjectSearch.trim().toLowerCase();
                      const semOk =
                        staffSubjectSemFilter === "ALL" ||
                        String(s.semester || "") ===
                          String(staffSubjectSemFilter);
                      const text =
                        `${s.subject_code || s.course_code || s.code || ""} ${s.subject_name || s.name || ""}`.toLowerCase();
                      const textMatch = !term || text.includes(term);

                      if (!semOk)
                        console.log(
                          "Filtered out by semester:",
                          s,
                          "Expected:",
                          staffSubjectSemFilter,
                          "Got:",
                          s.semester,
                        );
                      if (!textMatch)
                        console.log(
                          "Filtered out by search:",
                          s,
                          "Search term:",
                          term,
                        );

                      return semOk && textMatch;
                    });

                    console.log("Subjects after filter:", filtered.length);
                    console.log("Filtered subjects:", filtered);
                    console.log("=== End Subject Display Debug ===");

                    return filtered.map((s, idx) => {
                      const subKey = makeSubjectKey(s, idx);
                      return (
                        <label
                          key={subKey}
                          className="flex items-start gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={staffSubjectKeys.includes(subKey)}
                            onChange={() => handleToggleSubject(subKey)}
                          />
                          <span className="leading-5">
                            <span className="font-semibold text-foreground">
                              {s.subject_code || s.course_code || s.code}
                            </span>{" "}
                            – {s.subject_name || s.name}
                            {s.semester ? (
                              <span className="text-muted-foreground">
                                {" "}
                                (Sem {s.semester})
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    });
                  })()}
                  {(subjectCatalog || []).length === 0 &&
                    !subjectCatalogLoading && (
                      <div className="text-xs text-muted-foreground">
                        {subjectCatalogError ? (
                          <div className="space-y-2">
                            <p className="text-red-500">
                              Failed to load subjects
                            </p>
                            <p className="text-[10px]">
                              {subjectCatalogError.message}
                            </p>
                            <button
                              onClick={() => refetchSubjects()}
                              className="text-blue-500 hover:text-blue-400 underline text-[10px]"
                            >
                              Retry loading subjects
                            </button>
                            {data?.subject_catalog && (
                              <p className="text-[10px] text-green-600">
                                Fallback: Using command center data (
                                {data.subject_catalog.length} subjects)
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p>No subjects available</p>
                            <p className="text-[10px] mt-1">
                              Command center:{" "}
                              {data
                                ? data.subject_catalog
                                  ? `${data.subject_catalog.length} subjects`
                                  : "no subjects"
                                : isLoading
                                  ? "loading..."
                                  : "failed"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  {subjectCatalogLoading && (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Loading subjects...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-2 shrink-0 bg-muted/10">
              <button
                className="tab-chip"
                onClick={() => {
                  setStaffModalOpen(false);
                  setEditingStaff(null);
                  setStaffForm({
                    username: "",
                    name: "",
                    email: "",
                    department: "",
                    password: "password123",
                  });
                }}
                disabled={
                  createStaffMutation.isPending || updateStaffMutation.isPending
                }
              >
                Cancel
              </button>
              <button
                onClick={handleStaffSubmit}
                className="btn-primary inline-flex items-center gap-2"
                disabled={
                  createStaffMutation.isPending || updateStaffMutation.isPending
                }
              >
                {editingStaff ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingStaff ? "Save Changes" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}

      {staffToDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setStaffToDelete(null)}
        >
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div>
              <p className="text-lg font-semibold text-foreground">
                Delete staff?
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                This will remove{" "}
                <span className="font-semibold text-primary">
                  {staffToDelete.name || staffToDelete.username}
                </span>{" "}
                and revoke their access.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="tab-chip"
                onClick={() => setStaffToDelete(null)}
                disabled={deleteStaffMutation.isPending}
              >
                Cancel
              </button>

              <button
                className="tab-chip !bg-rose-500/10 !text-rose-600 hover:!bg-rose-500/20"
                onClick={handleDeleteStaff}
                disabled={deleteStaffMutation.isPending}
              >
                {deleteStaffMutation.isPending
                  ? "DeletingÃÂ¢Ã¢–Â¬ÃÂ¦"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "AI" && (
        <RAGChat />
      )}

      {activeTab === "ASIE" && (
        <ASIEAdminDashboard onOpenStudentProfile={setSelectedRollNo} />
      )}

      {activeTab === "Subjects" && (
        <SubjectsManagementPanel
          studentBatchFilter={studentBatchFilter}
          studentSectionFilter={studentSectionFilter}
        />
      )}

      {activeTab === "Syllabus" && (
        <SyllabusHODView />
      )}

      {activeTab === "Achievements" && (
        <AchievementsPanel />
      )}

      <StudentProfile360 rollNo={selectedRollNo} onClose={handleCloseProfile} />
    </div>
  );
}
