import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Info, Search } from 'lucide-react';
import { useSubjectCatalog, useSubjectLeaderboard, useOverallLeaderboard, useBatches } from '../hooks/useAdminData';

interface LeaderboardViewProps {
  onSelectStudent?: (rollNo: string) => void;
}

export default function LeaderboardView({ onSelectStudent }: LeaderboardViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('OVERALL');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'top' | 'bottom'>('top');
  
  const { subjects, isLoading: isLoadingSubjects } = useSubjectCatalog(
    batchFilter !== 'ALL' ? batchFilter : undefined,
    sectionFilter || undefined
  );
  const { batches, isLoading: isLoadingBatches } = useBatches();

  // Sync subject selection
  useEffect(() => {
    if (subjects?.length && !selectedSubject) {
      // Default to Overall if possible, otherwise first subject
      setSelectedSubject('OVERALL');
    }
  }, [subjects, selectedSubject]);

  const isOverall = selectedSubject === 'OVERALL';
  const semesterVal = semesterFilter === 'ALL' ? undefined : Number(semesterFilter);

  const subjectLeaderboard = useSubjectLeaderboard(
    isOverall ? '' : selectedSubject,
    sectionFilter.trim() || undefined,
    semesterVal
  );

  const overallLeaderboard = useOverallLeaderboard(
    sectionFilter.trim() || undefined,
    batchFilter.trim() || undefined,
    semesterVal
  );

  const { leaderboard, isLoading: isLoadingLeaderboard } = isOverall ? overallLeaderboard : subjectLeaderboard;

  const handleRowClick = (rollNo: string) => {
    if (onSelectStudent) {
      onSelectStudent(rollNo);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subject Leaderboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Track top and bottom performers across different subjects and courses.</p>
        </div>
        
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-72">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isLoadingSubjects}
              className="w-full appearance-none rounded-xl border border-border/60 bg-card/50 pl-4 pr-10 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="OVERALL">Overall (All Subjects)</option>
              {isLoadingSubjects ? (
                <option value="" disabled>Loading subjects...</option>
              ) : subjects && subjects.length > 0 ? (
                subjects.map((sub: any) => (
                  <option key={sub.subject_code} value={sub.subject_code}>
                    {sub.subject_code} - {sub.subject_name}
                  </option>
                ))
              ) : null}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <Trophy size={16} className="text-primary/70" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-20 rounded-xl border border-border/60 bg-card/50 px-2 py-2.5 text-[12px] font-bold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
              aria-label="Filter by section"
            >
              <option value="">Sec</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-20 rounded-xl border border-border/60 bg-card/50 px-2 py-2.5 text-[12px] font-bold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
              aria-label="Filter by semester"
            >
              <option value="ALL">Sem</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>

            {isOverall && (
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-32 rounded-xl border border-border/60 bg-card/50 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
                aria-label="Filter by batch"
              >
                <option value="ALL">Batch</option>
                {batches?.map((b: string) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden">
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === 'top' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={18} />
              <span>Top Performers</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bottom')}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === 'bottom' ? 'bg-rose-500/10 text-rose-500 border-b-2 border-rose-500' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown size={18} />
              <span>Attention Required</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {isLoadingLeaderboard || isLoadingSubjects ? (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 animate-ping" />
                <p className="text-sm text-muted-foreground font-medium">Crunching ranking data...</p>
              </div>
            </div>
          ) : !leaderboard ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Info className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-base font-semibold text-foreground">No Details Available</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Select a subject to view performance rankings for that specific course.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                  <tr>
                    <th className="pb-4 pl-4 font-black">Rank</th>
                    <th className="pb-4">Student</th>
                    <th className="pb-4">Roll No</th>
                    <th className="pb-4">Section</th>
                    <th className="pb-4">Grade</th>
                    <th className="pb-4 text-right pr-4">{isOverall ? 'Average SGPA' : 'Total Marks'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {activeTab === 'top' && leaderboard.top_leaderboard.map((student: any) => (
                    <LeaderboardRow key={student.roll_no} student={student} isTop={true} isOverall={isOverall} onSelect={onSelectStudent} />
                  ))}
                  
                  {activeTab === 'bottom' && leaderboard.bottom_leaderboard.map((student: any) => (
                    <LeaderboardRow key={student.roll_no} student={student} isTop={false} isOverall={isOverall} onSelect={onSelectStudent} />
                  ))}

                  {activeTab === 'top' && leaderboard.top_leaderboard.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground italic">No top performers found for this criteria.</td>
                     </tr>
                  )}

                  {activeTab === 'bottom' && leaderboard.bottom_leaderboard.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-12 text-center text-rose-500/80 font-medium">No students in critical zone. Excellent performance!</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ student, isTop, isOverall, onSelect }: { student: any; isTop: boolean; isOverall: boolean; onSelect?: (rollNo: string) => void }) {
  return (
    <tr
      className="group transition-colors hover:bg-muted/30 cursor-pointer"
      onClick={() => onSelect?.(student.roll_no)}
    >
      <td className="py-4 pl-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
          student.class_rank === 1 ? 'bg-amber-500/10 text-amber-500' :
          student.class_rank === 2 ? 'bg-slate-300/10 text-slate-300' :
          student.class_rank === 3 ? 'bg-orange-700/10 text-orange-700' :
          isTop ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {isTop && student.class_rank <= 3 ? <Trophy size={14} className="mr-0.5" /> : null}
          {student.class_rank}
        </div>
      </td>
      <td className="py-4">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{student.student_name}</p>
        <p className="text-xs text-muted-foreground">{student.batch || '-'} • Sem {student.current_semester || '-'}</p>
      </td>
      <td className="py-4">
        <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{student.roll_no}</span>
      </td>
      <td className="py-4">
        <span className="text-xs font-semibold text-muted-foreground">{student.section || '-'}</span>
      </td>
      <td className="py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          ['O', 'A+', 'A'].includes(student.grade) ? 'bg-emerald-500/10 text-emerald-500' :
          ['U', 'F', 'FAIL'].includes(student.grade) ? 'bg-rose-500/10 text-rose-500' :
          'bg-slate-500/10 text-slate-500'
        }`}>
          {student.grade || 'N/A'}
        </span>
      </td>
      <td className="py-4 text-right pr-4">
        <span className={`font-bold text-base tracking-tight ${!isTop && student.total_marks < (isOverall ? 5.0 : 40) ? 'text-rose-500' : 'text-foreground'}`}>
          {student.total_marks.toFixed(isOverall ? 2 : 1)}
        </span>
        <span className="text-muted-foreground text-xs ml-1">/ {isOverall ? '10' : '100'}</span>
      </td>
    </tr>
  );
}
