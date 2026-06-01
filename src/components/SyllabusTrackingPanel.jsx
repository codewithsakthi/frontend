import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, CheckCircle2, Clock, PlusCircle, Edit3,
  Loader2, AlertTriangle, X, Save, ChevronDown, ChevronRight, Trash2
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (pct >= 50) return { bar: 'bg-amber-400',   text: 'text-amber-600'   };
  return             { bar: 'bg-rose-500',        text: 'text-rose-600'    };
}

function ProgressBar({ value, height = 'h-2', showLabel = false }) {
  const colors = pctColor(value);
  return (
    <div className="w-full">
      <div className={`w-full ${height} rounded-full bg-muted/30 overflow-hidden`}>
        <div
          className={`${height} rounded-full ${colors.bar} transition-all duration-700`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className={`text-xs font-bold mt-1 ${colors.text}`}>{value.toFixed(1)}%</p>
      )}
    </div>
  );
}

// ─── Add Unit Modal ───────────────────────────────────────────────────────────

function AddUnitModal({ subject, academicYear, onClose, onSaved }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    unit_number: '',
    unit_title: '',
    total_periods: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      api.post('syllabus/plan', data),
    onSuccess: (data) => {
      onSaved(data);
      onClose();
    },
    onError: (err) => setError(err?.response?.data?.detail || 'Failed to create plan'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.unit_number || !form.unit_title || !form.total_periods) {
      setError('All fields are required');
      return;
    }
    mutation.mutate({
      subject_id: subject.subject_id,
      academic_year: academicYear,
      section: subject.section || null,
      unit_number: parseInt(form.unit_number),
      unit_title: form.unit_title,
      total_periods: parseInt(form.total_periods),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <h3 className="font-bold text-foreground">Add Syllabus Unit</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subject.subject_name} · {subject.course_code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit No.</label>
              <input
                type="number" min="1" max="20"
                className="input-field w-full"
                value={form.unit_number}
                onChange={e => setForm(p => ({ ...p, unit_number: e.target.value }))}
                placeholder="1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Periods</label>
              <input
                type="number" min="0" max="500"
                className="input-field w-full"
                value={form.total_periods}
                onChange={e => setForm(p => ({ ...p, total_periods: e.target.value }))}
                placeholder="12"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit Title</label>
            <input
              type="text"
              className="input-field w-full"
              value={form.unit_title}
              onChange={e => setForm(p => ({ ...p, unit_title: e.target.value }))}
              placeholder="e.g., Introduction to Data Structures"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted/40 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Unit Row (inline progress update) ───────────────────────────────────────

function UnitRow({ unit, onDelete }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [coveredInput, setCoveredInput] = useState(unit.covered_periods);
  const [notesInput, setNotesInput] = useState(unit.notes || '');
  const colors = pctColor(unit.completion_percentage);

  const mutation = useMutation({
    mutationFn: (data) =>
      api.patch(`syllabus/progress/${unit.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['syllabus-my-progress']);
      setEditing(false);
    },
  });

  const handleSave = () => {
    mutation.mutate({
      covered_periods: parseInt(coveredInput) || 0,
      notes: notesInput || null,
    });
  };

  const isComplete = unit.completion_percentage >= 100;

  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/40 bg-muted/10'
    }`}>
      <div className="flex items-start gap-3">
        {/* Unit badge */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
          isComplete ? 'bg-emerald-500/20 text-emerald-600' : 'bg-primary/10 text-primary'
        }`}>
          {isComplete ? <CheckCircle2 size={16} /> : unit.unit_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{unit.unit_title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => { setEditing(!editing); setCoveredInput(unit.covered_periods); setNotesInput(unit.notes || ''); }}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(unit.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={unit.completion_percentage} />
            <span className={`text-xs font-black flex-shrink-0 ${colors.text}`}>
              {unit.covered_periods}/{unit.total_periods}
            </span>
            <span className={`text-xs flex-shrink-0 ${colors.text}`}>
              {unit.completion_percentage.toFixed(0)}%
            </span>
          </div>

          {unit.remaining_periods > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock size={11} /> {unit.remaining_periods} periods remaining
            </p>
          )}

          {/* Inline edit */}
          {editing && (
            <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground w-28 flex-shrink-0">Covered Periods</label>
                <input
                  type="number" min="0" max={unit.total_periods}
                  className="input-field flex-1 !py-1.5 !text-sm"
                  value={coveredInput}
                  onChange={e => setCoveredInput(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground w-28 flex-shrink-0">Notes</label>
                <input
                  type="text"
                  className="input-field flex-1 !py-1.5 !text-sm"
                  placeholder="Optional notes..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted/40 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={mutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 disabled:opacity-60">
                  {mutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Subject Accordion ────────────────────────────────────────────────────────

function SubjectSection({ summary, academicYear, onAddUnit, onDeleteUnit }) {
  const [expanded, setExpanded] = useState(true);
  const colors = pctColor(summary.overall_completion_percentage);

  return (
    <div className="panel overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 p-5"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-foreground truncate">{summary.subject_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{summary.course_code} · Sem {summary.semester}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className={`text-lg font-black ${colors.text}`}>
              {summary.overall_completion_percentage.toFixed(0)}%
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {summary.total_covered_periods}/{summary.total_planned_periods} periods
            </p>
          </div>
          <div className="hidden sm:block w-20">
            <ProgressBar value={summary.overall_completion_percentage} height="h-1.5" />
          </div>
          {expanded ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border/30">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              { label: 'Total Units', value: summary.total_units },
              { label: 'Completed', value: summary.completed_units, color: 'text-emerald-600' },
              { label: 'Remaining Periods', value: summary.total_planned_periods - summary.total_covered_periods, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
                <p className={`text-xl font-black ${color || 'text-foreground'}`}>{value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Unit rows */}
          <div className="space-y-2">
            {summary.units.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No units added yet. Click "Add Unit" to start tracking.
              </div>
            )}
            {summary.units.map(unit => (
              <UnitRow key={unit.id} unit={unit} onDelete={onDeleteUnit} />
            ))}
          </div>

          {/* Add unit button */}
          <button
            onClick={() => onAddUnit(summary)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm font-semibold"
          >
            <PlusCircle size={16} />
            Add Unit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function SyllabusTrackingPanel() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear}-${String(currentYear + 1).slice(-2)}`);
  const [addUnitModal, setAddUnitModal] = useState(null); // subject summary

  const { data: summaries = [], isLoading, error } = useQuery({
    queryKey: ['syllabus-my-progress', academicYear],
    queryFn: () =>
      api.get(`syllabus/my-progress?academic_year=${academicYear}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (planId) => api.delete(`syllabus/plan/${planId}`),
    onSuccess: () => queryClient.invalidateQueries(['syllabus-my-progress']),
  });

  const overallPct = useMemo(() => {
    if (!summaries.length) return 0;
    const totalPlanned = summaries.reduce((s, x) => s + x.total_planned_periods, 0);
    const totalCovered = summaries.reduce((s, x) => s + x.total_covered_periods, 0);
    return totalPlanned > 0 ? (totalCovered / totalPlanned) * 100 : 0;
  }, [summaries]);

  // Academic year options (last 3 years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const y = currentYear - i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });

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
          <h2 className="text-2xl font-bold tracking-tight">Syllabus Tracker</h2>
          <p className="text-muted-foreground mt-1">Track unit-wise syllabus coverage for each of your subjects.</p>
        </div>
        <select
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Overall progress */}
      {summaries.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Overall Coverage · {academicYear}
              </p>
              <p className={`text-4xl font-black ${pctColor(overallPct).text}`}>
                {overallPct.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {summaries.reduce((s, x) => s + x.total_covered_periods, 0)} /&nbsp;
                {summaries.reduce((s, x) => s + x.total_planned_periods, 0)} periods covered
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              <ProgressBar value={overallPct} height="h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600">
          <AlertTriangle size={18} />
          <p className="text-sm font-semibold">Failed to load syllabus data. Try again later.</p>
        </div>
      )}

      {/* No subjects */}
      {!isLoading && summaries.length === 0 && (
        <div className="py-20 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-3xl bg-muted">
            <BookOpen size={32} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No syllabus units yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Your subjects will appear here once you add syllabus units.<br />
              Go to a subject below and click "Add Unit" to get started.
            </p>
          </div>
        </div>
      )}

      {/* Subject sections */}
      <div className="space-y-4">
        {summaries.map(summary => (
          <SubjectSection
            key={summary.subject_id}
            summary={summary}
            academicYear={academicYear}
            onAddUnit={(s) => setAddUnitModal(s)}
            onDeleteUnit={(planId) => deleteMutation.mutate(planId)}
          />
        ))}
      </div>

      {/* Add Unit Modal */}
      {addUnitModal && (
        <AddUnitModal
          subject={addUnitModal}
          academicYear={academicYear}
          onClose={() => setAddUnitModal(null)}
          onSaved={() => {
            queryClient.invalidateQueries(['syllabus-my-progress']);
            setAddUnitModal(null);
          }}
        />
      )}
    </div>
  );
}
