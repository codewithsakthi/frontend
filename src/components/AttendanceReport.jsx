import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Users, CheckCircle2, AlertCircle, Loader2,
  ShieldAlert, TrendingUp, BookOpen, RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { mapDailyAttendanceReport } from '../api/mappers';

const PctBadge = ({ pct }) => {
  const color = pct >= 75 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : pct >= 60 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${color}`}>
      {pct.toFixed(1)}%
    </span>
  );
};

export default function AttendanceReport() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['admin-daily-attendance-report', date],
    queryFn: () => api.get(`admin/attendance/daily-report?target_date=${date}`).then(mapDailyAttendanceReport),
  });

  const report = data;
  const rows = report?.rows || [];

  // Group by period for visual clarity
  const byPeriod = React.useMemo(() => {
    const map = {};
    rows.forEach(row => {
      if (!map[row.period]) map[row.period] = [];
      map[row.period].push(row);
    });
    return map;
  }, [rows]);

  const periods = Object.keys(byPeriod).sort((a, b) => parseInt(a) - parseInt(b));

  // Overall stats
  const totalPresent = rows.reduce((a, r) => a + r.present_count, 0);
  const totalAbsent = rows.reduce((a, r) => a + r.absent_count, 0);
  const totalStudents = rows.reduce((a, r) => a + r.total_students, 0);
  const overallPct = totalStudents > 0 ? (totalPresent / totalStudents * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Attendance Report</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Combined subject-wise attendance across all periods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-border/40 bg-muted/30">
            <CalendarDays size={16} className="text-primary" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'} />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: totalStudents.toLocaleString(), icon: Users, color: 'text-primary' },
            { label: 'Present', value: totalPresent.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Absent', value: totalAbsent.toLocaleString(), icon: AlertCircle, color: 'text-rose-500' },
            { label: 'Avg Attendance', value: `${overallPct.toFixed(1)}%`, icon: TrendingUp, color: overallPct >= 75 ? 'text-emerald-500' : 'text-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="panel flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-muted/30`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Content */}
      {isLoading ? (
        <div className="panel flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="panel border-rose-500/20 text-center py-12">
          <AlertCircle size={32} className="text-rose-500 mx-auto mb-3" />
          <p className="font-bold text-rose-500">Failed to load report</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel border-dashed border-border text-center py-20">
          <CalendarDays size={40} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No attendance recorded</h3>
          <p className="text-sm text-muted-foreground mt-2">No periods were marked on {date}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {periods.map(periodNum => (
            <div key={periodNum} className="panel">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-black text-sm">P{periodNum}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">Period {periodNum}</h3>
                  <p className="text-xs text-muted-foreground">{byPeriod[periodNum].length} subject(s) marked</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-muted-foreground">Subject</th>
                      <th className="text-center py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-muted-foreground">Total</th>
                      <th className="text-center py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-emerald-500">Present</th>
                      <th className="text-center py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-rose-500">Absent</th>
                      <th className="text-center py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-muted-foreground">%</th>
                      <th className="text-left py-2 pb-3 font-black uppercase text-[10px] tracking-wider text-muted-foreground">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {byPeriod[periodNum].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors group">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                            <div>
                              <p className="font-semibold">{row.subject_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{row.course_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center font-bold">{row.total_students}</td>
                        <td className="text-center">
                          <span className="font-bold text-emerald-500">{row.present_count}</span>
                        </td>
                        <td className="text-center">
                          <span className="font-bold text-rose-500">{row.absent_count}</span>
                        </td>
                        <td className="text-center">
                          <PctBadge pct={row.attendance_percentage} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {row.is_substitute && (
                              <ShieldAlert size={12} className="text-amber-500" />
                            )}
                            <div>
                              <p className="text-xs font-semibold">
                                {row.marked_by_faculty_name || 'Unknown'}
                              </p>
                              {row.is_substitute && (
                                <span className="text-[10px] text-amber-600 font-black">SUBSTITUTE</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Summary Footer */}
          <div className="panel bg-muted/20 border-dashed">
            <p className="text-xs text-muted-foreground text-center">{report?.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
