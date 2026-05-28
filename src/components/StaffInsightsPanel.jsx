import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Target, ShieldAlert, ArrowUpRight, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function StaffInsightsPanel({ onOpenStudentProfile }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['staff-students'],
    queryFn: () => api.get('staff/me').then(r => {
      // Use the students endpoint if available
      return [];
    }),
    enabled: false,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    // Try to open Student 360 with the entered roll number
    onOpenStudentProfile(query);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="panel">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Student Insights Portal</h3>
            <p className="text-sm text-muted-foreground">
              360-degree student evaluation and professional profile view
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative group w-full max-w-xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter roll number to view Student 360..."
            className="w-full pl-12 pr-4 py-4 bg-card rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2 !px-4 text-xs"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4 hover:border-primary/30 transition-colors">
            <Target className="text-accent shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">Cohort Placement Readiness</h4>
              <p className="text-xs text-muted-foreground mt-1">View placement-ready students and their profiles</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4 hover:border-primary/30 transition-colors">
            <ShieldAlert className="text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">Early Warning Detection</h4>
              <p className="text-xs text-muted-foreground mt-1">Identify at-risk students requiring intervention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick student list - recent/assigned students */}
      <div className="panel">
        <h4 className="text-sm font-bold text-foreground mb-4">Quick Access</h4>
        <p className="text-xs text-muted-foreground">
          Type a roll number above to open the Student 360 drawer with full academic, professional, and risk analytics.
        </p>
      </div>
    </div>
  );
}
