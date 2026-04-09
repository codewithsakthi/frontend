import React, { useMemo, useState, useEffect } from "react";
import LeaderboardView from "../features/admin/views/LeaderboardView";
import PlacementView from "../features/admin/views/PlacementView";
import RiskRadarView from "../features/admin/views/RiskRadarView";
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
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
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
} from "lucide-react";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import StudentProfile360 from "../components/StudentProfile360";
import { validatePassThreshold } from "../utils/performanceUtils";
import AICopilot from "../components/AICopilot";
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
function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="metric-card">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </article>
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
      className="row-card w-full text-left group"
    >
      <div>
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

function ActionCard({ item }: { item: AdminCohortAction }) {
  const toneClass =
    item.tone === "critical"
      ? "bg-rose-500/12 text-rose-700"
      : item.tone === "warning"
        ? "bg-amber-500/12 text-amber-700"
        : item.tone === "positive"
          ? "bg-emerald-500/12 text-emerald-700"
          : "bg-slate-500/12 text-slate-700";

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{item.title}</p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.detail}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClass}`}
        >
          {item.tone}
        </span>
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-primary">
        {item.metric}
      </p>
    </div>
  );
}

function FacultyCard({ item }: { item: FacultyImpactMatrixItem }) {
  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {item.faculty_name}
          </p>

          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
            {item.subject_code}
          </p>
        </div>

        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
          {item.impact_label || "IMPACT"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {item.subject_name}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-bold text-foreground">
        <div>
          <p className="text-lg leading-tight">
            {item.failure_rate?.toFixed?.(1) ?? item.failure_rate}%
          </p>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Fail Rate
          </p>
        </div>

        <div>
          <p className="text-lg leading-tight">
            {item.average_marks?.toFixed?.(1) ?? item.average_marks}
          </p>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Avg Marks
          </p>
        </div>

        <div>
          <p className="text-lg leading-tight">{item.student_count}</p>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Students
          </p>
        </div>
      </div>
    </div>
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

function ThresholdConfigModal({ 
  subject, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  subject: SubjectCatalogItem | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (subjectId: number, data: any) => void; 
}) {
  const [passThreshold, setPassThreshold] = useState<string>("");
  const [percentileAverage, setPercentileAverage] = useState<string>("30");
  const [percentileGood, setPercentileGood] = useState<string>("60");
  const [percentileExcellent, setPercentileExcellent] = useState<string>("85");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (subject && isOpen) {
      setPassThreshold(subject.pass_threshold?.toString() || "50");
      setPercentileAverage(subject.percentile_average?.toString() || "30");
      setPercentileGood(subject.percentile_good?.toString() || "60");
      setPercentileExcellent(subject.percentile_excellent?.toString() || "85");
      setError("");
    }
  }, [subject, isOpen]);

  const handleSave = () => {
    const threshold = parseFloat(passThreshold);
    const pAvg = parseFloat(percentileAverage);
    const pGood = parseFloat(percentileGood);
    const pExc = parseFloat(percentileExcellent);
    
    // Validate hierarchy
    if (pExc < pGood || pGood < pAvg || pAvg < 0 || pExc > 100) {
      setError("Hierarchy must be: Excellent (max) >= Good >= Average >= 0");
      return;
    }

    if (subject) {
      onSave(subject.id, {
        pass_threshold: threshold,
        percentile_average: pAvg,
        percentile_good: pGood,
        percentile_excellent: pExc
      });
      onClose();
    }
  };

  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 space-y-6">
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

          <div className="bg-muted/10 p-5 rounded-xl space-y-4 border border-border/40">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Performance Classification Rules
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-500 font-bold uppercase tracking-widest">Excellent</span>
                  <span className="text-muted-foreground">Percentile &gt; {percentileExcellent}</span>
                </div>
                <input
                  type="number"
                  value={percentileExcellent}
                  onChange={(e) => setPercentileExcellent(e.target.value)}
                  className="input-field w-full !py-1.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-500 font-bold uppercase tracking-widest">Good</span>
                  <span className="text-muted-foreground">Percentile {percentileGood}-{percentileExcellent}</span>
                </div>
                <input
                  type="number"
                  value={percentileGood}
                  onChange={(e) => setPercentileGood(e.target.value)}
                  className="input-field w-full !py-1.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-500 font-bold uppercase tracking-widest">Average</span>
                  <span className="text-muted-foreground">Percentile {percentileAverage}-{percentileGood}</span>
                </div>
                <input
                  type="number"
                  value={percentileAverage}
                  onChange={(e) => setPercentileAverage(e.target.value)}
                  className="input-field w-full !py-1.5 text-sm"
                />
              </div>

              <div className="pt-2 border-t border-border/30">
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span className="text-red-500 font-bold uppercase tracking-widest">At Risk</span>
                  <span className="text-muted-foreground italic">Marks &lt; threshold OR percentile &lt; {percentileAverage}</span>
                </div>
              </div>
            </div>
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
    mutationFn: ({ subjectId, data }: { subjectId: number; data: any }) => {
      console.log("🔄 Updating thresholds for subject ID:", subjectId, "with payload:", data);
      return api.patch(`admin/subjects/${subjectId}/thresholds`, data);
    },
    onMutate: async ({ subjectId, data }) => {
      console.log("🔄 onMutate - Optimistically updating thresholds for subject:", subjectId);

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
            ? { ...subject, ...data }
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

  const handleSaveThreshold = (subjectId: number, data: any) => {
    updateThresholdMutation.mutate({ subjectId, data });
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
        password: "",
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
        password: "",
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
          password: "",
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
    "rank" | "name" | "roll_no"
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
    password: "",
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

        password: staffForm.password || "temp123",

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

  const toggleSort = (field: "rank" | "name" | "roll_no") => {
    if (studentSortBy === field) {
      setStudentSortDir(studentSortDir === "asc" ? "desc" : "asc");
    } else {
      setStudentSortBy(field);

      setStudentSortDir("asc");
    }
  };

  return (
    <div className="w-full pb-24 lg:pb-10">
      <div className="flex flex-wrap gap-2 mb-6">
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
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-chip ${activeTab === tab ? "!bg-primary !text-white shadow" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Leaderboard" && (
        <LeaderboardView onSelectStudent={setSelectedRollNo} />
      )}

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <header className="hero-panel">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                Enterprise Academic Intelligence
              </p>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                SPARK Command Center
              </h1>

              <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                {data?.daily_briefing ||
                  "Aggregating ranking, placement, bottleneck, and faculty impact signals."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
              </button>
            </div>
          </header>

          <AICopilot data={data} leaderboard={leaderboard} />

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
                  hint="Composite derived from GPA and attendance."
                />

                <Metric
                  label="Active Students"
                  value={String(data?.department_health.active_students ?? 0)}
                  hint="Current MCA population."
                />

                <Metric
                  label="At Risk"
                  value={String(data?.department_health.at_risk_count ?? 0)}
                  hint="Students above intervention threshold."
                />

                <Metric
                  label="Average GPA"
                  value={String(data?.department_health.average_gpa ?? 0)}
                  hint="Current department CGPA."
                />
              </>
            )}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article id="placement-pipeline" className="panel">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Placement Pipeline
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Ready and blocked cohorts for recruiter planning.
                  </p>
                </div>

                <Target size={18} className="text-primary" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Ready"
                  value={String(data?.placement_summary.ready_count ?? 0)}
                  hint="Drive eligible."
                />

                <Metric
                  label="Almost"
                  value={String(
                    data?.placement_summary.almost_ready_count ?? 0,
                  )}
                  hint="Near threshold."
                />

                <Metric
                  label="Blocked"
                  value={String(data?.placement_summary.blocked_count ?? 0)}
                  hint="Arrears/low GPA."
                />

                <Metric
                  label="Avg Code"
                  value={String(data?.placement_summary.avg_coding_score ?? 0)}
                  hint="Coding subject avg."
                />
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="panel">
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  HOD Action Queue
                </p>

                <p className="text-sm text-muted-foreground">
                  Critical interventions pending your approval.
                </p>
              </div>

              <div className="space-y-3">
                {data?.action_queue?.map(
                  (item: AdminCohortAction, i: number) => (
                    <ActionCard key={i} item={item} />
                  ),
                )}
              </div>
            </article>

            <article className="panel">
              <div className="mb-4">
                <p className="text-lg font-semibold text-foreground">
                  Command Alerts
                </p>

                <p className="text-sm text-muted-foreground">
                  System notifications and anomaly detections.
                </p>
              </div>

              <div className="space-y-3">
                {data?.alerts?.map((alert: string, i: number) => (
                  <div key={i} className="row-card">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-rose-500/10 p-2 text-rose-500">
                        <AlertTriangle size={16} />
                      </div>

                      <p className="text-sm text-foreground">{alert}</p>
                    </div>
                  </div>
                ))}
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
                <ResponsiveContainer width="100%" height="100%">
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

                    <XAxis dataKey="date" hide />

                    <YAxis hide domain={["auto", "auto"]} />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-primary)"
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
              <p className="text-lg font-semibold text-foreground">
                Batch Health
              </p>

              <div className="mt-4 space-y-3">
                {data?.batch_health?.map((batch: any) => (
                  <div key={batch.batch} className="row-card">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Batch {batch.batch}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {batch.student_count} students | {batch.at_risk_count}{" "}
                        at risk
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {batch.average_gpa} GPA
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {batch.average_attendance}% Attn
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="text-lg font-semibold text-foreground">
                Semester Pulse
              </p>

              <div className="mt-4 space-y-3">
                {data?.semester_pulse?.map((pulse: any) => (
                  <div key={pulse.semester} className="row-card">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Semester {pulse.semester}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {pulse.student_count} enrollment | {pulse.at_risk_count}{" "}
                        flagging
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {pulse.average_gpa} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Faculty impact anchor for sidebar */}
          <section id="faculty-impact" className="panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Staff Impact Board
                </p>

                <p className="text-sm text-muted-foreground">
                  Faculty performance and load snapshots.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Briefcase size={16} className="text-primary" />

                <span>{data?.faculty_impact?.length || 0} entries</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(data?.faculty_impact || [])
                .slice(0, 6)
                .map((item: FacultyImpactMatrixItem) => (
                  <FacultyCard
                    key={`${item.faculty_id}-${item.subject_code}`}
                    item={item}
                  />
                ))}

              {(data?.faculty_impact?.length ?? 0) === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-8 text-center border border-dashed border-border/60 rounded-2xl">
                  <Activity size={20} className="text-muted-foreground" />

                  <p className="text-sm text-muted-foreground">
                    No staff metrics available yet.
                  </p>
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
              <ResponsiveContainer width="100%" height="100%">
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
                          {value > 0 ? value : "ÃÂ¢Ã¢–Â¬Ã¢–¬Â"}{" "}
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaderboardSpread}>
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data?.subject_coverage?.map((item) => (
                <div key={item.semester} className="row-card">
                  <p className="text-sm font-bold">Sem {item.semester}</p>

                  <p className="text-xs text-muted-foreground">
                    {item.ranked_subjects}/{item.total_subjects} Ranked
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {activeTab === "Students" && (
        <div className="space-y-6">
          <article className="panel">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Student Management
                </p>

                <p className="text-sm text-muted-foreground">
                  Full cohort directory with advanced sorting and batch filters.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="input-field !py-2 pl-9 !w-64"
                    placeholder="Search name, roll, email..."
                  />
                </div>

                <select
                  className="input-field !py-2"
                  value={studentBatchFilter}
                  onChange={(e) => setStudentBatchFilter(e.target.value)}
                >
                  <option value="ALL">All Batches</option>

                  {batchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  className="input-field !py-2"
                  value={studentSemesterFilter}
                  onChange={(e) => setStudentSemesterFilter(e.target.value)}
                >
                  <option value="ALL">All Semesters</option>

                  {semesterOptions.map((s) => (
                    <option key={s} value={String(s)}>
                      Sem {s}
                    </option>
                  ))}
                </select>

                <select
                  className="input-field !py-2"
                  value={studentSectionFilter}
                  onChange={(e) => setStudentSectionFilter(e.target.value)}
                >
                  <option value="ALL">All Secs</option>

                  <option value="A">Sec A</option>

                  <option value="B">Sec B</option>
                </select>

                <button
                  onClick={() => setStudentRiskOnly(!studentRiskOnly)}
                  className={`tab-chip ${studentRiskOnly ? "!bg-rose-500 !text-white" : ""}`}
                >
                  Risk Only
                </button>

                <button
                  onClick={() => {
                    const batch =
                      studentBatchFilter !== "ALL"
                        ? studentBatchFilter
                        : "2025-2027";

                    assignSectionsMutation.mutate(batch);
                  }}
                  disabled={assignSectionsMutation.isPending}
                  className="tab-chip !bg-primary !text-primary-foreground disabled:opacity-50"
                  title="Assign Sections A and B"
                >
                  {assignSectionsMutation.isPending
                    ? "Assigning..."
                    : "Assign Sections"}
                </button>
              </div>
            </div>

            {/* Desktop table */}

            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {[
                      { key: "rank", label: "Rank" },

                      { key: "name", label: "Name" },

                      { key: "roll_no", label: "Roll No" },

                      { key: "batch", label: "Batch" },

                      { key: "section", label: "Sec" },

                      { key: "sem", label: "Sem" },

                      { key: "gpa", label: "GPA" },

                      { key: "attendance", label: "Attn %" },

                      { key: "backlogs", label: "Backlogs" },
                    ].map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left">
                        <button
                          onClick={() =>
                            ["rank", "name", "roll_no", "gpa", "attendance", "backlogs"].includes(col.key) &&
                            toggleSort(col.key as any)
                          }
                          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${["rank", "name", "roll_no", "gpa", "attendance", "backlogs"].includes(col.key) ? "hover:text-primary transition-colors" : "text-muted-foreground"}`}
                        >
                          {col.label}

                          {studentSortBy === col.key && (
                            <span className="text-primary">
                              {studentSortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {isStudentsFetching
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={9} className="px-4 py-8">
                            <div className="skeleton h-8 w-full" />
                          </td>
                        </tr>
                      ))
                    : studentDirectory?.items.map((item) => (
                        <tr
                          key={item.roll_no}
                          className="border-t border-border/40 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-4 font-mono font-bold text-primary">
                            #{item.rank || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => setSelectedRollNo(item.roll_no)}
                              className="text-left group"
                            >
                              <p className="font-semibold group-hover:text-primary">
                                {item.name}
                              </p>

                              <p className="text-[10px] text-muted-foreground uppercase">
                                {item.email?.split("@")[0]}
                              </p>
                            </button>
                          </td>

                          <td className="px-4 py-4 text-muted-foreground">
                            <div>{item.roll_no}</div>

                            {item.reg_no && (
                              <div className="text-[10px] opacity-70">
                                Reg: {item.reg_no}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
                              {item.batch}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-muted-foreground">
                            {item.section || "-"}
                          </td>

                          <td className="px-4 py-4 text-muted-foreground">
                            {item.current_semester}
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {Number(item.average_grade_points).toFixed(2)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-medium ${item.attendance_percentage < 75 ? "text-rose-500" : "text-emerald-500"}`}
                            >
                              {Number(item.attendance_percentage).toFixed(1)}%
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-bold ${item.backlogs > 0 ? "text-rose-500" : "text-muted-foreground"}`}
                            >
                              {item.backlogs}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}

            <div className="grid gap-3 sm:hidden">
              {isStudentsFetching
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 rounded-2xl" />
                  ))
                : studentDirectory?.items.map((item) => (
                    <button
                      key={`m-${item.roll_no}`}
                      onClick={() => setSelectedRollNo(item.roll_no)}
                      className="row-card w-full text-left group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            #{item.rank || "-"}
                          </span>

                          <p className="truncate font-semibold group-hover:text-primary transition-colors">
                            {item.name}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {item.roll_no}
                          {item.reg_no ? ` / Reg: ${item.reg_no}` : ""}{" "}
                          | Sem {item.current_semester} |{" "}
                          <span className="rounded-full bg-muted px-1.5 py-0.5">
                            {item.batch}
                          </span>{" "}
                          | Sec {item.section || "-"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                        <span className="font-bold">
                          {Number(item.average_grade_points).toFixed(2)} GPA
                        </span>

                        <span
                          className={`font-medium ${item.attendance_percentage < 75 ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          {Number(item.attendance_percentage).toFixed(1)}% Attn
                        </span>

                        {item.backlogs > 0 && (
                          <span className="font-bold text-rose-500">
                            {item.backlogs} backlogs
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground tracking-wide">
                Showing {studentDirectory?.items.length || 0} of{" "}
                {studentDirectory?.pagination.total || 0} total students
              </p>

              <div className="flex gap-2">
                <button
                  disabled={studentOffset === 0}
                  onClick={() => setStudentOffset((o) => Math.max(0, o - 10))}
                  className="tab-chip disabled:opacity-30"
                >
                  Previous
                </button>

                <button
                  disabled={
                    !studentDirectory ||
                    studentOffset + 10 >= studentDirectory.pagination.total
                  }
                  onClick={() => setStudentOffset((o) => o + 10)}
                  className="tab-chip disabled:opacity-30"
                >
                  Next
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
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
                    password: "",
                  });

                  setStaffModalOpen(true);
                }}
              >
                <Plus size={16} />
                Add Staff
              </button>
            </div>
          </div>

          <article className="panel space-y-3">
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
              <p className="text-lg font-semibold text-foreground">
                Batch Attendance Overview
              </p>
              <p className="text-sm text-muted-foreground">
                Average attendance percentage by batch.
              </p>
            </div>
            <div className="grid gap-3">
              {data?.batch_health?.map((batch: any) => (
                <div key={batch.batch} className="row-card">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Batch {batch.batch}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {batch.student_count} students
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48">
                      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            batch.average_attendance >= 75
                              ? "bg-emerald-500"
                              : batch.average_attendance >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${batch.average_attendance}%` }}
                        />
                      </div>
                    </div>
                    <p
                      className={`font-bold w-16 text-right ${
                        batch.average_attendance >= 75
                          ? "text-emerald-600"
                          : batch.average_attendance >= 60
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {batch.average_attendance}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">
                Semester Attendance Trends
              </p>
              <p className="text-sm text-muted-foreground">
                Attendance performance by semester.
              </p>
            </div>
            {data?.semester_pulse && data.semester_pulse.length > 0 ? (
              <div className="grid gap-3">
                {data.semester_pulse.map((pulse: any, idx: number) => (
                  <div key={idx} className="row-card">
                    <p className="text-sm font-semibold text-foreground">
                      Semester {pulse.semester}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pulse.avg_attendance ?? "N/A"}% average
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No semester attendance data available.
              </p>
            )}
          </article>

          <article className="panel">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground">
                Attendance Summary
              </p>
              <p className="text-sm text-muted-foreground">
                Department-wide attendance metrics.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Avg Attendance
                </p>
                <p className="text-2xl font-black text-foreground">
                  {data?.department_health?.average_attendance ?? 0}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Active Students
                </p>
                <p className="text-2xl font-black text-foreground">
                  {data?.department_health?.active_students ?? 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  At Risk
                </p>
                <p className="text-2xl font-black text-rose-600">
                  {data?.department_health?.at_risk_count ?? 0}
                </p>
              </div>
            </div>
          </article>
        </div>
      )}

      {staffModalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-[min(520px,90vw)] rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border space-y-4">
            <div className="flex items-start justify-between gap-3">
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
                    password: "",
                  });
                }}
              >
                Close
              </button>
            </div>

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

            <div className="flex justify-end gap-2">
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
                    password: "",
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-[min(420px,90vw)] rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border space-y-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                Delete staff?
              </p>

              <p className="text-sm text-muted-foreground">
                This will remove{" "}
                <span className="font-semibold">
                  {staffToDelete.name || staffToDelete.username}
                </span>{" "}
                and revoke their access.
              </p>
            </div>

            <div className="flex justify-end gap-2">
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

      {activeTab === "Subjects" && (
        <SubjectsManagementPanel
          studentBatchFilter={studentBatchFilter}
          studentSectionFilter={studentSectionFilter}
        />
      )}

      <StudentProfile360 rollNo={selectedRollNo} onClose={handleCloseProfile} />
    </div>
  );
}
