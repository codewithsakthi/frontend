import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import TimetableGrid from './TimetableGrid';
import { mapTimetableEntries } from '../api/mappers';

export default function StudentTimetable({ semesterOverride }) {
  const { user } = useAuthStore();
  // Remove section override - let backend determine section from student's database record
  const semester = semesterOverride || user?.current_semester || 2;

  const { data, isLoading } = useQuery({
    queryKey: ['student-timetable', semester], // Remove section from cache key
    queryFn: () => api.get('students/timetable', { params: { semester } }).then(mapTimetableEntries), // Only send semester
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Get section from timetable data (determined by backend)
  const studentSection = data && data.length > 0 ? data[0].section : '?';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Class Timetable
          </p>
          <h3 className="text-xl font-bold text-foreground">
            Section {studentSection} • Semester {semester}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Based on MCA II Semester schedule (Jan–May 2026).
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
          Attendance Friendly
        </div>
      </div>

      <TimetableGrid
        entries={data || []}
        title="Your Weekly Grid"
        subtitle="Plan study hours and labs with the official section timetable."
      />
    </div>
  );
}
