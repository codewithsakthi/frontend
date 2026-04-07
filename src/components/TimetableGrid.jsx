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

      <div className="pb-2 -mx-4 sm:mx-0">
        <div className="border-y sm:border border-border/70 sm:rounded-xl md:rounded-[2rem] overflow-hidden bg-[var(--panel)] shadow-[0_8px_30px_rgba(2,6,23,0.5)] md:shadow-[0_18px_45px_rgba(2,6,23,0.85)]">
          <div className="grid grid-cols-8 divide-x divide-border bg-muted/30">
            <div className="p-1 md:p-4" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="p-1 md:p-4 text-center font-black text-[8px] md:text-[10px] uppercase tracking-widest text-foreground flex flex-col items-center justify-center"
              >
                <span className="md:hidden">P{hour}</span>
                <span className="hidden md:inline">Hour {hour}</span>
                <span className="hidden md:block text-[9px] mt-1 text-foreground/85">{hourLabel(hour)}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="grid grid-cols-8 divide-x divide-y-0 divide-border md:min-h-[96px]">
                <div className="p-1 md:p-4 flex flex-col items-center justify-center bg-muted/20">
                  <Clock size={12} className="text-muted-foreground hidden md:block md:mb-1" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-foreground">
                    <span className="md:hidden">{day.slice(0, 3)}</span>
                    <span className="hidden md:inline">{day}</span>
                  </span>
                </div>
                {HOURS.map((hour) => {
                  const entry = getEntry(dayIdx, hour);
                  const isSenior = entry?.semester >= 3;
                  return (
                    <div key={`${dayIdx}-${hour}`} className="p-0.5 md:p-2 group">
                      {entry ? (
                        <div
                          className={`flex flex-col items-center md:items-start justify-center md:justify-start h-full p-1 md:p-3 rounded-md md:rounded-2xl border transition-all overflow-hidden ${
                            isSenior
                              ? 'bg-violet-500/45 border-violet-400/90 group-hover:bg-violet-500/65 text-white'
                              : 'bg-emerald-500/40 border-emerald-400/90 group-hover:bg-emerald-500/60 text-emerald-50'
                          }`}
                        >
                          <p className="text-[7px] md:text-[10px] font-black uppercase tracking-tight mb-0 md:mb-1 text-white/85 text-center md:text-left leading-[1.1] md:leading-tight break-words md:break-all">
                            <span className="md:hidden line-clamp-3">{entry.subject_name}</span>
                            <span className="hidden md:inline">{entry.course_code}</span>
                          </p>
                          <p className="hidden md:block text-xs font-bold leading-tight line-clamp-2 text-white">
                            {entry.subject_name}
                          </p>
                          <div className="hidden md:flex mt-2 items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-white/15 text-[9px] font-black uppercase text-white">
                              Sec {entry.section}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full min-h-[40px] md:min-h-0 rounded-md md:rounded-2xl border border-dashed border-border/40 bg-card/5 group-hover:bg-muted/25 transition-colors" />
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
