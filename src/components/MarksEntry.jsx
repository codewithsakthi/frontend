import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../api/client';

export default function MarksEntry({ subject, onClose }) {
  const queryClient = useQueryClient();
  const [localMarks, setLocalMarks] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch students for this subject
  const { data: students, isLoading } = useQuery({
    queryKey: ['staff-subject-marks', subject.subject_id],
    queryFn: () => api.get(`staff/subjects/${subject.subject_id}/marks`),
  });

  useEffect(() => {
    if (students) {
      setLocalMarks(students.map(s => ({
        student_id: s.student_id,
        roll_no: s.roll_no,
        name: s.name,
        subject_id: subject.subject_id,
        semester: subject.semester,
        cit1_marks: s.cit1 ?? '',
        cit2_marks: s.cit2 ?? '',
        cit3_marks: s.cit3 ?? ''
      })));
    }
  }, [students, subject]);

  const mutation = useMutation({
    mutationFn: (updates) => api.patch('staff/marks', updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-subject-students', subject.subject_id]);
      setIsDirty(false);
      // Optional: show success toast
    },
  });

  const handleMarkChange = (rollNo, field, value) => {
    const numValue = value === '' ? '' : parseFloat(value);
    if (numValue !== '' && isNaN(numValue)) return;
    
    setLocalMarks(prev => prev.map(m => 
      m.roll_no === rollNo ? { ...m, [field]: numValue } : m
    ));
    setIsDirty(true);
  };

  const handleSave = () => {
    // ── Delta Update Logic ──
    // Only send marks that have actually changed since the last fetch
    const updates = [];
    
    localMarks.forEach(m => {
      const original = students?.find(s => s.student_id === m.student_id);
      if (!original) return;

      const base = {
        student_id: m.student_id,
        subject_id: m.subject_id,
        semester: m.semester,
      };

      // Individual field comparison
      // Individual field comparison - Use strict check for NULL (empty string in local state)
      const toBackendMark = (val) => val === '' ? null : val;

      if (toBackendMark(m.cit1_marks) !== original.cit1) {
        updates.push({ ...base, assessment_type: 'CIT1', marks: toBackendMark(m.cit1_marks) });
      }
      if (toBackendMark(m.cit2_marks) !== original.cit2) {
        updates.push({ ...base, assessment_type: 'CIT2', marks: toBackendMark(m.cit2_marks) });
      }
      if (toBackendMark(m.cit3_marks) !== original.cit3) {
        updates.push({ ...base, assessment_type: 'CIT3', marks: toBackendMark(m.cit3_marks) });
      }
    });

    if (updates.length === 0) {
      setIsDirty(false);
      return;
    }

    mutation.mutate(updates);
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden animate-in fade-in duration-200">
      <div className="w-full h-full flex flex-col">
        <header className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/10">
          <div>
            <h2 className="text-xl font-bold">{subject.subject_name}</h2>
            <p className="text-sm text-muted-foreground">{subject.course_code} | Semester {subject.semester} | Section {subject.section || 'A'}</p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                <AlertCircle size={14} /> Unsaved Changes
              </span>
            )}
            <button 
              onClick={handleSave} 
              disabled={!isDirty || mutation.isPending}
              className="btn-primary flex items-center gap-2 py-2 px-4"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Marks
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="w-full max-w-6xl">
            <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border text-left">
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Roll No</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Student Name</th>
                <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground w-20 text-center">CIT 1</th>
                <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground w-20 text-center">CIT 2</th>
                <th className="py-3 px-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground w-20 text-center">CIT 3</th>
              </tr>
            </thead>
            <tbody>
              {localMarks.map((student) => (
                <tr key={student.roll_no} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{student.roll_no}</td>
                  <td className="py-3 px-4 font-semibold">{student.name}</td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      className="input-field text-center !py-1"
                      value={student.cit1_marks}
                      onChange={(e) => handleMarkChange(student.roll_no, 'cit1_marks', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      className="input-field text-center !py-1"
                      value={student.cit2_marks}
                      onChange={(e) => handleMarkChange(student.roll_no, 'cit2_marks', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      className="input-field text-center !py-1"
                      value={student.cit3_marks}
                      onChange={(e) => handleMarkChange(student.roll_no, 'cit3_marks', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
