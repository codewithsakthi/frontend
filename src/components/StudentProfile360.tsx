import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  ShieldCheck,
  Target,
  AlertTriangle,
  ArrowUp,
  Search,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/client';
import { mapFullStudentRecord } from '../api/mappers';
import { Student360Profile, FullStudentRecord } from '../types';
import AIStudentCoach from './AIStudentCoach';
import { useAuthStore } from '../store/authStore';
import { filterGradedSubjects } from '../utils/subjectFilters.js';

interface StudentProfile360Props {
  rollNo: string | null;
  onClose: () => void;
}

const downloadWithToken = async (endpoint: string, fileName: string) => {
  try {
    const token = useAuthStore.getState().token;
    const VITE_API_URL = import.meta.env.VITE_API_URL;
    const FALLBACK_URL = 'https://spark-backend-n5s2.onrender.com';
    let API_BASE = VITE_API_URL || FALLBACK_URL;
    
    if (API_BASE && !API_BASE.startsWith('http')) {
      API_BASE = `https://${API_BASE}`;
    }

    const response = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

/**
 * Calculate letter grade from total marks
 * Fixes issue where grades are NULL in database but marks are present
 */
const calculateGradFromMarks = (totalMarks: number | null | undefined): string | null => {
  if (totalMarks === null || totalMarks === undefined) return null;
  
  const marks = Number(totalMarks);
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 35) return 'D';
  return 'U';
};

/**
 * Calculate grade point from grade
 */
const GRADE_POINTS: Record<string, number> = {
  'O': 10, 'S': 10,
  'A+': 9,
  'A': 8,
  'B+': 7, 'B': 6,
  'C': 5, 'C+': 5,
  'D': 4,
  'E': 3,
  'U': 0, 'F': 0, 'FAIL': 0,
  'P': 5, 'PASS': 5,
};

const getGradePoint = (grade: string | null | undefined): number => {
  if (!grade) return 0;
  return GRADE_POINTS[String(grade).toUpperCase()] ?? 0;
};

const FAILING_GRADES = new Set(['U', 'F', 'FAIL', 'RA', 'AB', 'ABSENT', 'WH']);

const isFailingGrade = (grade: string | null | undefined): boolean => {
  if (!grade) return false;
  return FAILING_GRADES.has(String(grade).toUpperCase());
};

/**
 * Enrich grade record with calculated values if missing
 * Handles multiple field name variations for total marks
 */
const enrichGradeRecord = (record: any) => {
  if (!record) return record;
  
  // Try multiple field names for total marks (API returns 'marks', but check others)
  const totalMarks = record.marks ?? record.total_marks ?? record.score ?? null;
  
  // Calculate grade from marks if not already set
  const calculatedGrade = record.grade || calculateGradFromMarks(totalMarks);
  
  // Determine result status: PASS unless grade is U, F, or FAIL
  const isFailGrade = calculatedGrade && ['U', 'F', 'FAIL'].includes(String(calculatedGrade).toUpperCase());
  const resultStatus = record.result_status || (calculatedGrade ? (isFailGrade ? 'FAIL' : 'PASS') : null);
  
  // Calculate grade point
  const gradePoint = record.grade_point ?? getGradePoint(calculatedGrade);
  
  return {
    ...record,
    marks: totalMarks,
    grade: calculatedGrade,
    result_status: resultStatus,
    grade_point: gradePoint,
  };
};

export default function StudentProfile360({ rollNo, onClose }: StudentProfile360Props) {
  const drawerRef = React.useRef<HTMLElement | null>(null);
  const [semesterFilter, setSemesterFilter] = React.useState<string>('all');
  const [selectedTranscriptSem, setSelectedTranscriptSem] = React.useState<string>('');
  const [selectedCIT, setSelectedCIT] = React.useState<number | null>(null);
  const { data, isLoading } = useQuery<Student360Profile>({
    queryKey: ['student-360', rollNo],
    queryFn: () => api.get(`admin/student-360/${rollNo}`),
    enabled: Boolean(rollNo),
  });
  const { data: record, isLoading: isRecordLoading } = useQuery<FullStudentRecord>({
    queryKey: ['student-record', rollNo],
    queryFn: () => api.get(`admin/student-record/${rollNo}`).then(mapFullStudentRecord),
    enabled: Boolean(rollNo),
    staleTime: 60_000,
  });

  const allSemGrades = filterGradedSubjects(record?.semester_grades || [])
    .map(enrichGradeRecord);
  const semesterOptions = Array.from(new Set(allSemGrades.map((g) => g.semester).filter(Boolean))).sort(
    (a, b) => Number(a) - Number(b)
  );

  // Initialize transcript semester on first load
  React.useEffect(() => {
    if (semesterOptions.length > 0 && !selectedTranscriptSem) {
      setSelectedTranscriptSem(String(semesterOptions[0]));
    }
  }, [semesterOptions, selectedTranscriptSem]);

  // Initialize CIT selection when semester changes
  React.useEffect(() => {
    if (selectedTranscriptSem) {
      const sem = Number(selectedTranscriptSem);
      const citsByTest = {};
      (record?.internal_marks || []).forEach(im => {
        if (Number(im.semester) === sem) {
          if (!citsByTest[im.test_number]) {
            citsByTest[im.test_number] = [];
          }
          citsByTest[im.test_number].push(im);
        }
      });
      const testNumbers = Object.keys(citsByTest).map(Number).sort();
      if (testNumbers.length > 0 && selectedCIT === null) {
        setSelectedCIT(testNumbers[0]);
      }
    }
  }, [selectedTranscriptSem, record?.internal_marks, selectedCIT]);

  const filteredGrades =
    semesterFilter === 'all'
      ? allSemGrades
      : allSemGrades.filter((g) => String(g.semester) === semesterFilter);

  if (!rollNo) return null;

  return (
    <aside ref={drawerRef} className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl overflow-y-auto border-l border-border/70 bg-[var(--panel-strong)] p-6 shadow-[0_0_40px_rgba(2,6,23,0.25)]">
      <button
        type="button"
        onClick={() => drawerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur md:right-8"
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ArrowUp size={18} />
      </button>

      <button
        type="button"
        onClick={onClose}
        className="fixed bottom-5 right-5 z-[60] rounded-full border border-border bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur md:right-8"
      >
        Close Student 360
      </button>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/50 bg-gradient-to-r from-primary/5 to-sky-500/5 p-6">
        <div className="flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Student 360</p>
          <div className="flex items-center gap-3 mt-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{data?.student_name || rollNo}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold">{data?.batch}</span> • 
                <span className="font-semibold"> Roll {rollNo}</span>
                {data?.reg_no && <span> • Reg {data.reg_no}</span>}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <CheckCircle2 size={12} />
              Sem {data?.current_semester || '-'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/30 bg-blue-500/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
              Sec {data?.section || '-'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-500/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">
              <TrendingUp size={12} />
              GPA {data?.overall_gpa.toFixed(2) || '-'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {data && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/8 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/12 hover:border-primary/50"
              onClick={() => downloadWithToken(`admin/export/resume/${data.roll_no}.pdf`, `${data.roll_no}-resume.pdf`)}
            >
              <Download size={14} />
              Export Resume
            </button>
          )}
          <button type="button" onClick={onClose} className="tab-chip">Close</button>
        </div>
      </div>

      {isLoading || isRecordLoading ? (
        <div className="mt-8 space-y-4">
          <div className="skeleton h-28 rounded-[1.5rem]" />
          <div className="skeleton h-64 rounded-[1.5rem]" />
          <div className="skeleton h-64 rounded-[1.5rem]" />
        </div>
      ) : data ? (
        <div className="mt-8 space-y-5 pb-24">
          {/* ADMIN CRITICAL STATUS - TOP PRIORITY */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {/* Risk Level */}
            <article className={`rounded-2xl border p-4 ${
              data.risk_level === 'Critical' ? 'border-rose-300/40 bg-gradient-to-br from-rose-500/12 to-transparent' :
              data.risk_level === 'High' ? 'border-amber-300/40 bg-gradient-to-br from-amber-500/12 to-transparent' :
              data.risk_level === 'Moderate' ? 'border-blue-300/40 bg-gradient-to-br from-blue-500/12 to-transparent' :
              'border-emerald-300/40 bg-gradient-to-br from-emerald-500/12 to-transparent'
            }`}>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Risk Assessment</p>
              <p className={`mt-3 text-3xl font-black ${
                data.risk_level === 'Critical' ? 'text-rose-600' :
                data.risk_level === 'High' ? 'text-amber-600' :
                data.risk_level === 'Moderate' ? 'text-blue-600' :
                'text-emerald-600'
              }`}>{data.risk_level}</p>
              <p className="mt-2 text-xs text-muted-foreground">Based on CGPA, attendance, backlogs</p>
            </article>

            {/* Placement Ready */}
            <article className={`rounded-2xl border p-4 ${
              data.placement_signal === 'Placement Ready'
                ? 'border-emerald-300/40 bg-gradient-to-br from-emerald-500/12 to-transparent'
                : 'border-amber-300/40 bg-gradient-to-br from-amber-500/12 to-transparent'
            }`}>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Placement Status</p>
              <p className={`mt-3 text-2xl font-black ${
                data.placement_signal === 'Placement Ready' ? 'text-emerald-600' : 'text-amber-600'
              }`}>{data.placement_signal}</p>
              <p className="mt-2 text-xs text-muted-foreground">{data.attendance_band} attendance</p>
            </article>

            {/* Active Arrears */}
            <article className={`rounded-2xl border p-4 ${
              data.active_arrears > 0
                ? 'border-rose-300/40 bg-gradient-to-br from-rose-500/12 to-transparent'
                : 'border-emerald-300/40 bg-gradient-to-br from-emerald-500/12 to-transparent'
            }`}>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Backlogs</p>
              <p className={`mt-3 text-3xl font-black ${data.active_arrears > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {data.active_arrears}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{data.active_arrears === 0 ? 'All clear' : 'Needs intervention'}</p>
            </article>
          </section>

          {/* KEY METRICS FOR ADMIN ANALYSIS */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Overall GPA</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{data.overall_gpa.toFixed(2)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Cumulative: {data.gpa_trend} trend</p>
            </article>

            <article className="rounded-xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Attendance</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{data.attendance_percentage.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">{data.attendance_band}</p>
            </article>

            <article className="rounded-xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Class Rank</p>
              <p className="mt-3 text-3xl font-bold text-foreground">#{data.peer_benchmark.class_rank}</p>
              <p className="mt-1 text-xs text-muted-foreground">of {data.peer_benchmark.cohort_size} in sem</p>
            </article>

            <article className="rounded-xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Percentile</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{data.peer_benchmark.percentile}%</p>
              <p className="mt-1 text-xs text-muted-foreground">vs cohort avg</p>
            </article>
          </section>

          {/* ACADEMIC PERFORMANCE QUICK VIEW */}
          <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6">
            <div className="mb-5">
              <p className="text-lg font-bold text-foreground">Academic Performance</p>
              <p className="text-sm text-muted-foreground">Grade distribution and subject breakdown by semester</p>
            </div>

            {semesterOptions.map((sem) => {
              const semGrades = allSemGrades.filter((g) => String(g.semester) === String(sem));
              // Only consider subjects that have grades for pass/fail calculations
              const gradedSubjects = semGrades.filter((g) => g.grade && g.grade.trim() !== '');
              const passCount = gradedSubjects.filter((g) => !isFailingGrade(g.grade)).length;
              const problemSubjects = gradedSubjects.filter((g) => isFailingGrade(g.grade));
              const failCount = problemSubjects.length;
              const passRate = gradedSubjects.length > 0 ? Math.round((passCount / gradedSubjects.length) * 100) : 0;
              const avgInternal = semGrades.length > 0 
                ? Math.round(semGrades.reduce((sum, g) => sum + (g.internal_marks || 0), 0) / semGrades.length)
                : 0;

              return (
                <div key={`sem-summary-${sem}`} className="mb-4 rounded-lg border border-border/30 bg-card/30 p-4 last:mb-0">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Semester {sem}</p>
                      <p className="mt-2 text-sm text-foreground">{semGrades.length} subjects</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-emerald-600">Pass Rate</p>
                      <p className="mt-2 flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-600">{passRate}%</span>
                        <span className="text-xs text-muted-foreground">({passCount}/{gradedSubjects.length})</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--chart-1)]">Internal Avg</p>
                      <p className="mt-2 text-xl font-bold text-[var(--chart-1)]">{avgInternal}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Grades</p>
                      <div className="mt-2 flex gap-1 flex-wrap text-xs">
                        {['O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'P'].map((grade) => {
                          const count = semGrades.filter((g) => g.grade === grade).length;
                          if (count === 0) return null;
                          return (
                            <span key={grade} className={`rounded px-2 py-1 font-semibold ${
                              grade === 'O' ? 'bg-emerald-500/20 text-emerald-700' :
                              grade === 'A+' || grade === 'A' ? 'bg-blue-500/20 text-blue-700' :
                              grade === 'B+' || grade === 'B' ? 'bg-amber-500/20 text-amber-700' :
                              grade === 'C+' || grade === 'C' ? 'bg-yellow-500/20 text-yellow-700' :
                              'bg-slate-500/20 text-slate-700'
                            }`}>
                              {grade}:{count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Show problem subjects if any */}
                  {failCount > 0 && (
                    <div className="mt-3 border-t border-border/20 pt-3">
                      <p className="mb-2 text-xs font-semibold text-rose-600">⚠️ Problem Subjects ({failCount})</p>
                      <div className="flex flex-wrap gap-2">
                        {problemSubjects.map((g) => (
                            <span key={`${g.subject_code}-problem`} className="rounded bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700">
                              {g.subject_code} ({g.grade})
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* ALERTS & ACTION ITEMS - PRIORITY BASED */}
          <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6">
            <div className="mb-5">
              <p className="text-lg font-bold text-foreground">Admin Actions Required</p>
              <p className="text-sm text-muted-foreground">Prioritized steps for intervention</p>
            </div>
            <div className="space-y-2.5">
              {data.recommended_actions.length > 0 ? (
                data.recommended_actions.map((action, idx) => (
                  <div key={action} className={`flex gap-3 rounded-lg border p-3.5 ${
                    idx === 0
                      ? 'border-rose-300/40 bg-gradient-to-r from-rose-500/12 to-transparent'
                      : idx === 1
                        ? 'border-amber-300/40 bg-gradient-to-r from-amber-500/12 to-transparent'
                        : 'border-blue-300/40 bg-gradient-to-r from-blue-500/12 to-transparent'
                  }`}>
                    <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                      idx === 0 ? 'bg-rose-500/20 text-rose-700' :
                      idx === 1 ? 'bg-amber-500/20 text-amber-700' :
                      'bg-blue-500/20 text-blue-700'
                    }`}>
                      {idx === 0 ? '🔴' : idx === 1 ? '🟡' : '🔵'}
                    </div>
                    <p className="text-sm leading-6 text-foreground pt-0.5">{action}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-emerald-300/40 bg-gradient-to-r from-emerald-500/12 to-transparent p-3.5">
                  <p className="text-sm text-emerald-700">✅ No immediate actions required. Student is on track.</p>
                </div>
              )}
            </div>
          </section>

          {/* COMPLETE ACADEMIC TRANSCRIPT - WITH DROPDOWN */}
          <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-foreground">Complete Academic Transcript</p>
                <p className="text-sm text-muted-foreground">Select a semester to view detailed course breakdown</p>
              </div>
              {semesterOptions.length > 0 && (
                <select
                  value={selectedTranscriptSem}
                  onChange={(e) => setSelectedTranscriptSem(e.target.value)}
                  className="tab-chip bg-card outline-none"
                >
                  <option value="">Select Semester...</option>
                  {semesterOptions.map((opt) => (
                    <option key={opt} value={String(opt)}>
                      Semester {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {semesterOptions.length === 0 ? (
              <div className="rounded-lg border border-amber-300/40 bg-gradient-to-r from-amber-500/12 to-transparent p-6 text-center">
                <p className="text-sm text-amber-700 font-medium">No transcript data available yet. Grades will appear once semester results are finalized.</p>
              </div>
            ) : selectedTranscriptSem ? (
              (() => {
                const sem = Number(selectedTranscriptSem);
                const semGrades = allSemGrades.filter((g) => Number(g.semester) === sem);
                // Calculate weighted SGPA: SUM(grade_point * credits) / SUM(credits) 
                const totalWeightedPoints = semGrades.reduce((sum, g) => sum + ((g.grade_point || 0) * (g.credits || 0)), 0);
                const totalCredits = semGrades.reduce((sum, g) => sum + (g.credits || 0), 0);
                const semesterGPA = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(3) : '0.000';

                return (
                  <div className="space-y-6">
                    {/* Semester Header */}
                    <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Semester {sem}</p>
                          <p className="mt-2 text-3xl font-black text-primary">{semesterGPA}</p>
                          <p className="mt-1 text-sm text-muted-foreground">SGPA • {semGrades.length} courses</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p className="font-semibold">{semGrades.filter((g) => g.grade && !isFailingGrade(g.grade)).length} passed</p>
                          <p className="text-xs">of {semGrades.length} courses</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: Semester Results Table */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-foreground">Semester Grades</h3>
                      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/40">
                              <th className="px-3 py-2.5 text-left font-semibold text-foreground">Sl. No.</th>
                              <th className="px-3 py-2.5 text-left font-semibold text-foreground">Code</th>
                              <th className="px-3 py-2.5 text-left font-semibold text-foreground">Subject</th>
                              <th className="px-3 py-2.5 text-center font-semibold text-foreground">Sem</th>
                              <th className="px-3 py-2.5 text-center font-semibold text-foreground">Grade</th>
                              <th className="px-3 py-2.5 text-center font-semibold text-foreground">Result</th>
                              <th className="px-3 py-2.5 text-center font-semibold text-foreground">Total</th>
                              {semGrades.some(g => g.internal_marks !== null) && (
                                <th className="px-3 py-2.5 text-center font-semibold text-foreground">Internal</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {semGrades.map((grade, idx) => {
                              const internalMarks = grade.internal_marks !== null && grade.internal_marks !== undefined ? Math.round(grade.internal_marks) : null;
                              const resultStatus = grade.result_status || (grade.grade && isFailingGrade(grade.grade) ? 'FAIL' : 'PASS');
                              return (
                                <tr key={`${grade.subject_code}-${selectedTranscriptSem}`} className="border-b border-border/30 hover:bg-muted/20">
                                  <td className="px-3 py-2.5 text-foreground font-medium">{idx + 1}</td>
                                  <td className="px-3 py-2.5 text-foreground font-mono text-xs">{grade.subject_code || '—'}</td>
                                  <td className="px-3 py-2.5 text-foreground max-w-xs truncate">{grade.subject_title || grade.subject_name || '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-foreground">{selectedTranscriptSem || '—'}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/15 font-bold text-primary text-xs">
                                      {grade.grade || '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-foreground text-xs">
                                    <span className={`inline-block px-2 py-1 rounded-full font-semibold ${resultStatus === 'PASS' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-rose-500/20 text-rose-700'}`}>
                                      {resultStatus || '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-semibold text-foreground">{grade.marks !== null && grade.marks !== undefined ? grade.marks : '—'}</td>
                                  {semGrades.some(g => g.internal_marks !== null) && (
                                    <td className="px-3 py-2.5 text-center text-foreground">
                                      {internalMarks !== null ? `${internalMarks}/100` : '—'}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Row */}
                      {semGrades.length > 0 && (
                        <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Sum of (Credit × Grade Point)</p>
                              <p className="mt-1 text-xl font-black text-foreground">
                                {(semGrades.reduce((sum, g) => sum + ((g.credits || 0) * (g.grade_point || 0)), 0)).toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Sum of Credit</p>
                              <p className="mt-1 text-xl font-black text-foreground">
                                {(semGrades.reduce((sum, g) => sum + (g.credits || 0), 0)).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">SGPA</p>
                              <p className="mt-1 text-xl font-black text-primary">{semesterGPA}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: CIT Exam Scores Table - WITH DROPDOWN */}
                    {(() => {
                      const citsByTest = {};
                      (record?.internal_marks || []).forEach(im => {
                        if (Number(im.semester) === sem) {
                          if (!citsByTest[im.test_number]) {
                            citsByTest[im.test_number] = [];
                          }
                          citsByTest[im.test_number].push(im);
                        }
                      });

                      const testNumbers = Object.keys(citsByTest).map(Number).sort();
                      
                      if (testNumbers.length === 0) return null;

                      const selectedTestMarks = citsByTest[selectedCIT || testNumbers[0]] || [];
                      const avgMark = selectedTestMarks.length > 0 
                        ? (selectedTestMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / selectedTestMarks.length).toFixed(2)
                        : '0.00';

                      return (
                        <div>
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-foreground">CIT Exam Scores</p>
                              <p className="text-xs text-muted-foreground">Centralised Internal Tests</p>
                            </div>
                            <select
                              value={String(selectedCIT || testNumbers[0])}
                              onChange={(e) => setSelectedCIT(Number(e.target.value))}
                              className="tab-chip bg-card outline-none"
                            >
                              {testNumbers.map((testNum) => (
                                <option key={testNum} value={String(testNum)}>
                                  CIT {testNum}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/50 bg-muted/40">
                                  <th className="px-3 py-2.5 text-left font-semibold text-foreground">Sl. No.</th>
                                  <th className="px-3 py-2.5 text-left font-semibold text-foreground">Subject Name</th>
                                  <th className="px-3 py-2.5 text-center font-semibold text-foreground">Mark (%)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedTestMarks.map((mark, idx) => (
                                  <tr key={`${mark.subject_code}-${selectedCIT}`} className="border-b border-border/30 hover:bg-muted/20">
                                    <td className="px-3 py-2.5 text-foreground font-medium">{idx + 1}</td>
                                    <td className="px-3 py-2.5 text-foreground">{mark.subject_title || mark.subject_code}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100/50 font-bold text-blue-700">
                                        {mark.percentage?.toFixed(1) || '—'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* CIT Summary Row */}
                          <div className="mt-3 rounded-lg border border-border/50 bg-blue-50/30 p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Total (%)</p>
                            <p className="mt-1 text-lg font-black text-blue-700">{avgMark}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-border/30 bg-card/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">Select a semester above to view transcript</p>
              </div>
            )}

            {/* Overall CGPA Summary */}
            {semesterOptions.length > 0 && (
              <div className="mt-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Overall Cumulative GPA</p>
                    <p className="mt-2 text-4xl font-black text-primary">{data?.overall_gpa.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Across {semesterOptions.length} semester{semesterOptions.length !== 1 ? 's' : ''}</p>
                    <p className="mt-1 text-sm font-semibold"><span className={data?.gpa_trend === 'Rising' ? 'text-emerald-600' : data?.gpa_trend === 'Stable' ? 'text-blue-600' : 'text-amber-600'}>{data?.gpa_trend}</span> trend</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics & Performance Graphs */}
            {semesterOptions.length > 0 && (
              <div className="mt-6 space-y-6">
                {/* SGPA Trend Graph */}
                {(() => {
                  const sgpaData = semesterOptions.map(sem => {
                    const semGrades = allSemGrades.filter((g) => Number(g.semester) === sem);
                    // Calculate weighted SGPA: SUM(grade_point * credits) / SUM(credits)
                    const totalWeightedPoints = semGrades.reduce((sum, g) => sum + ((g.grade_point || 0) * (g.credits || 0)), 0);
                    const totalCredits = semGrades.reduce((sum, g) => sum + (g.credits || 0), 0);
                    const sgpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
                    return {
                      semester: `Sem ${sem}`,
                      SGPA: parseFloat(sgpa.toFixed(2)),
                    };
                  });

                  return (
                    <div className="rounded-lg border border-border/50 bg-card/30 p-5">
                      <p className="mb-4 text-sm font-bold text-foreground">SGPA Trend Analysis</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sgpaData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                          <XAxis dataKey="semester" stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} />
                          <YAxis stroke="var(--muted-foreground)" domain={[0, 10]} tick={{ fill: 'var(--muted-foreground)' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                            }}
                            labelStyle={{ color: 'var(--muted-foreground)' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="SGPA" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                {/* Current Semester CIT Scores */}
                {selectedTranscriptSem && (() => {
                  const sem = Number(selectedTranscriptSem);
                  const citsByTest = {};
                  (record?.internal_marks || []).forEach(im => {
                    if (Number(im.semester) === sem) {
                      if (!citsByTest[im.test_number]) {
                        citsByTest[im.test_number] = [];
                      }
                      citsByTest[im.test_number].push(im);
                    }
                  });

                  const citAvgData = Object.entries(citsByTest).map(([testNum, marks]: [string, any[]]) => ({
                    name: `CIT ${testNum}`,
                    Average: parseFloat(
                      (marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length).toFixed(2)
                    ),
                  }));

                  return citAvgData.length > 0 ? (
                    <div className="rounded-lg border border-border/50 bg-card/30 p-5">
                      <p className="mb-4 text-sm font-bold text-foreground">CIT Average Performance (Semester {sem})</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={citAvgData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                          <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} />
                          <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                            }}
                            labelStyle={{ color: 'var(--muted-foreground)' }}
                          />
                          <Bar dataKey="Average" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null;
                })()}

                {/* Grade Distribution */}
                {(() => {
                  const gradeDistribution = {};
                  // Only include subjects that have a grade (exclude no grade subjects)
                  allSemGrades
                    .filter(g => g.grade && g.grade.trim() !== '')
                    .forEach(g => {
                      const grade = g.grade;
                      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
                    });

                  const gradeColorMap = {
                    'O': '#10b981',
                    'A+': '#3b82f6',
                    'A': '#60a5fa',
                    'B+': '#f59e0b',
                    'B': '#fbbf24',
                    'C+': '#fcd34d',
                    'C': '#fde047',
                    'P': '#ef4444',  // Red for Pass grade
                  };

                  const pieData = Object.entries(gradeDistribution).map(([grade, count]: [string, any]) => ({
                    name: grade,
                    value: count,
                  }));

                  return (
                    <div className="rounded-lg border border-border/50 bg-card/30 p-5">
                      <p className="mb-4 text-sm font-bold text-foreground">Grade Distribution (All Semesters)</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => (
                              <text fill="var(--foreground)" fontSize={12}>{`${name}: ${value}`}</text>
                            )}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={gradeColorMap[entry.name] || '#6b7280'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                            }}
                            labelStyle={{ color: 'var(--muted-foreground)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                {/* Strong & Weak Areas by Subject Type - Professional Radar Chart */}
                {/* Academic Competency Profile (Radar Chart) */}
                {data.skill_domains && data.skill_domains.length > 0 && (
                  <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/50 to-card/20 p-8 shadow-xl backdrop-blur-sm">
                    <div className="mb-8 flex items-end justify-between">
                      <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Academic Competency Profile</h3>
                        <p className="text-sm text-muted-foreground">Cross-domain performance compared to cohort average</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Average</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
                      <div className="relative flex items-center justify-center">
                        <div className="w-full max-w-[450px] aspect-square">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart 
                              data={data.skill_domains} 
                              margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                            >
                              <defs>
                                <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <PolarGrid stroke="var(--border)" strokeOpacity={0.5} gridType="polygon" />
                              <PolarAngleAxis 
                                dataKey="domain" 
                                stroke="var(--foreground)" 
                                tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                              />
                              <PolarRadiusAxis 
                                angle={90} 
                                domain={[0, 100]} 
                                axisLine={false} 
                                tick={false} 
                              />
                              
                              {/* Class Average Series */}
                              <Radar
                                name="Class Average"
                                dataKey="cohort_score"
                                stroke="#f59e0b"
                                fill="url(#cohortGradient)"
                                fillOpacity={1}
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                              />

                              {/* Student Score Series */}
                              <Radar
                                name="Student Score"
                                dataKey="score"
                                stroke="#06b6d4"
                                fill="url(#studentGradient)"
                                fillOpacity={1}
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />

                              <Tooltip 
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
                                        <p className="mb-3 text-sm font-bold border-b border-border pb-2">{payload[0].payload.domain}</p>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-2">
                                              <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                                              <span className="text-xs text-muted-foreground font-medium">Student</span>
                                            </div>
                                            <span className="text-sm font-black text-cyan-600">
                                              {payload.find(p => p.dataKey === 'score')?.value?.toFixed(1) || '0.0'}%
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-2">
                                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                              <span className="text-xs text-muted-foreground font-medium">Class Avg</span>
                                            </div>
                                            <span className="text-sm font-black text-amber-600">
                                              {payload.find(p => p.dataKey === 'cohort_score')?.value?.toFixed(1) || '0.0'}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 relative max-h-[500px] overflow-y-auto pr-1">
                        {data.skill_domains.map((item) => {
                          const diff = item.score - (item.cohort_score || 0);
                          const isBetter = diff >= 0;
                          
                          return (
                            <div key={item.domain} className="group relative overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-2.5 transition-all hover:bg-muted/30">
                              <div className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5" style={{ backgroundColor: isBetter ? '#10b981' : '#f43f5e' }}></div>
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">{item.domain}</p>
                                  <div className="mt-0.5 flex items-baseline gap-2">
                                    <p className="text-lg font-black text-foreground">{item.score.toFixed(1)}%</p>
                                    <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${
                                      isBetter ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20'
                                    }`}>
                                      {isBetter ? '+' : ''}{diff.toFixed(1)}% {isBetter ? '↑' : '↓'}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-2 text-right shrink-0">
                                  <p className="text-[9px] font-semibold uppercase text-muted-foreground/60">Class Avg</p>
                                  <p className="text-xs font-bold text-muted-foreground">{(item.cohort_score || 0).toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* AI Coach Panel - OPTIONAL INSIGHT */}
          <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-sky-500/5 p-4">
            <div className="mb-3">
              <p className="text-sm font-bold text-foreground">AI Coaching (Optional Insight)</p>
              <p className="text-xs text-muted-foreground">DeepSeek-V3 personalized analysis</p>
            </div>
            <AIStudentCoach
              rollNo={data.roll_no || rollNo || ''}
              studentName={data.student_name}
              compact={false}
            />
          </section>

          {/* CONTACT & RECORD INFO */}
          <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6">
            <div className="mb-5">
              <p className="text-lg font-bold text-foreground">Contact & Record</p>
              <p className="text-sm text-muted-foreground">Quick access to student information</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-border/30 bg-card/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Email</p>
                <p className="mt-2 text-sm font-medium text-foreground">{record?.contact_info?.email || '—'}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-card/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
                <p className="mt-2 text-sm font-medium text-foreground">{record?.contact_info?.phone_primary || '—'}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-card/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">City</p>
                <p className="mt-2 text-sm font-medium text-foreground">{record?.contact_info?.city || '—'}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-card/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Parent/Guardian</p>
                <p className="mt-2 text-sm font-medium text-foreground">{record?.family_details?.parent_guardian_name || record?.family_details?.father_name || '—'}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-card/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Emergency Phone</p>
                <p className="mt-2 text-sm font-medium text-foreground">{record?.family_details?.parent_phone || record?.family_details?.emergency_phone || '—'}</p>
              </div>
              <div className={`rounded-lg border p-4 ${
                (record?.record_health?.completion_percentage || 0) > 50
                  ? 'border-emerald-300/40 bg-gradient-to-br from-emerald-500/12 to-transparent'
                  : 'border-amber-300/40 bg-gradient-to-br from-amber-500/12 to-transparent'
              }`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Record Completeness</p>
                <p className={`mt-2 text-sm font-bold ${
                  (record?.record_health?.completion_percentage || 0) > 50 ? 'text-emerald-600' : 'text-amber-600'
                }`}>{record?.record_health?.completion_percentage || 0}%</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="hero-button !text-foreground !border-border !bg-card"
                onClick={() => downloadWithToken(`admin/export/resume/${data.roll_no}.pdf`, `${data.roll_no}-resume.pdf`)}
                >
                  <Download size={16} />
                  Download Resume
                </button>
                <button
                  type="button"
                  className="hero-button !text-foreground !border-border !bg-card"
                  onClick={() => downloadWithToken(`admin/exports/grade-sheet/${data.roll_no}.pdf`, `${data.roll_no}-grade-sheet.pdf`)}
                >
                  <Download size={16} />
                  PDF Grade Sheet
                </button>
              </div>
            </section>
        </div>
      ) : null}
    </aside>
  );
}
