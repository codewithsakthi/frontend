import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [1, 2, 3, 4, 5, 6, 7];

const hourLabel = (hour) => {
  switch (hour) {
    case 1: return '9:15 - 10:05';
    case 2: return '10:05 - 10:55';
    case 3: return '11:10 - 12:00';
    case 4: return '12:00 - 12:50';
    case 5: return '01:30 - 02:20';
    case 6: return '02:20 - 03:10';
    case 7: return '03:10 - 04:00';
    default: return '';
  }
};

export default function TimetableGrid({ entries = [], title = 'Weekly Timetable', subtitle, legend = true }) {
  const getEntry = (dayIdx, hour) =>
    entries.find((e) => e.day_of_week === dayIdx && e.period === hour);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {legend && (
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" />
              Sem 1-2
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-violet-500/20 border border-violet-500/30" />
              Sem 3+
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1000px] border border-border/70 rounded-[2rem] overflow-hidden bg-[var(--panel)] shadow-[0_18px_45px_rgba(2,6,23,0.85)]">
          <div className="grid grid-cols-8 divide-x divide-border bg-muted/30">
            <div className="p-4" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="p-4 text-center font-black text-[10px] uppercase tracking-widest text-foreground flex flex-col items-center justify-center"
              >
                <span>Hour {hour}</span>
                <span className="text-[9px] mt-1 text-foreground/85">{hourLabel(hour)}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="grid grid-cols-8 divide-x divide-border min-h-[96px]">
                <div className="p-4 flex flex-col items-center justify-center bg-muted/20">
                  <Clock size={16} className="text-muted-foreground mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{day}</span>
                </div>
                {HOURS.map((hour) => {
                  const entry = getEntry(dayIdx, hour);
                  const isSenior = entry?.semester >= 3;
                  return (
                    <div key={`${dayIdx}-${hour}`} className="p-2 group">
                      {entry ? (
                        <div
                          className={`h-full p-3 rounded-2xl border transition-all ${
                            isSenior
                              ? 'bg-violet-500/45 border-violet-400/90 group-hover:bg-violet-500/65 text-white'
                              : 'bg-emerald-500/40 border-emerald-400/90 group-hover:bg-emerald-500/60 text-emerald-50'
                          }`}
                        >
                          <p className="text-[10px] font-black uppercase tracking-tight mb-1 text-white/85">
                            {entry.course_code}
                          </p>
                          <p className="text-xs font-bold leading-tight line-clamp-2 text-white">
                            {entry.subject_name}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-white/15 text-[9px] font-black uppercase text-white">
                              Sec {entry.section}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full rounded-2xl border border-dashed border-border/40 bg-card/5 group-hover:bg-muted/25 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
