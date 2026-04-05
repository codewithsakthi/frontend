import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import TimetableGrid from './TimetableGrid';

export default function SchedulePanel() {
  const { user } = useAuthStore();
  const [section, setSection] = useState('');
  
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['staff-personal-schedule', section],
    queryFn: () => api.get('staff/schedule', { params: section ? { section } : {} }),
  });

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Your Teaching Schedule</p>
            <p className="text-sm text-muted-foreground">{user?.name}'s Personal Timetable</p>
          </div>
        </div>
        <div className="inline-flex rounded-full bg-background/40 p-1 border border-border/60 shadow-inner">
          <button
            onClick={() => setSection('')}
            className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all ${
              section === '' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Classes
          </button>
          {['A', 'B'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSection(sec)}
              className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all ${
                section === sec ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Section {sec}
            </button>
          ))}
        </div>
      </div>

      <TimetableGrid
        entries={schedule || []}
        title={section ? `Your Classes • Section ${section}` : "Your Weekly Teaching Schedule"}
        subtitle="Your personal teaching schedule with assigned subjects and classes."
      />
    </div>
  );
}
