import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { 
  Loader2, Cpu, MessageSquare, Award, Flame, Zap, CheckCircle2, 
  HelpCircle, Compass, Star, Sparkles, TrendingUp, AlertTriangle, ShieldAlert
} from 'lucide-react';
import api from '../api/client';

export default function ASIEStudentDNA({ rollNo }) {
  // TanStack Query to fetch all capability DNA
  const { data: dna, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-dna', rollNo],
    queryFn: () => api.get(`students/dna/${rollNo}`),
    enabled: !!rollNo,
    staleTime: 300000,
  });

  // Fetch Potential Index / SPI growth details
  const { data: potential } = useQuery({
    queryKey: ['student-potential', rollNo],
    queryFn: () => api.get(`students/potential-index/${rollNo}`),
    enabled: !!rollNo,
    staleTime: 300000,
  });

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!dna?.capability_scores) return [];
    const s = dna.capability_scores;
    return [
      { subject: 'Academics', A: parseFloat(s.academic_score) },
      { subject: 'Technical', A: parseFloat(s.technical_score) },
      { subject: 'Communication', A: parseFloat(s.communication_score) },
      { subject: 'Leadership', A: parseFloat(s.leadership_score) },
      { subject: 'Sports', A: parseFloat(s.sports_score) },
      { subject: 'Creativity', A: parseFloat(s.creativity_score) },
      { subject: 'Discipline', A: parseFloat(s.discipline_score) },
      { subject: 'Consistency', A: parseFloat(s.consistency_score) },
      { subject: 'Placement', A: parseFloat(s.placement_score) },
      { subject: 'Growth', A: parseFloat(s.growth_score) },
    ];
  }, [dna]);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse text-sm font-semibold">
          Decoding Student DNA Matrix...
        </p>
      </div>
    );
  }

  if (isError || !dna) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="text-destructive" size={48} />
        <div>
          <h3 className="text-lg font-bold text-foreground">ASIE Activation Pending</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            The Student Intelligence Engine is currently initializing. Please check that grades, attendance, and extracurricular data are recorded.
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="mt-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow hover:bg-primary/95 transition-all"
        >
          Initialize Engine
        </button>
      </div>
    );
  }

  const scores = dna.capability_scores;
  const ai = dna.ai_profile;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: AI Primary & Secondary Identities */}
      <div className="relative overflow-hidden rounded-[2.5rem] glass-dark border border-border/40 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 card-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1">
              <Sparkles size={10} /> AI Student DNA Profile
            </span>
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
              Primary Identity: <span className="text-gradient font-black">{ai?.primary_identity || `Analytical ${dna.profile_type}`}</span>
            </h2>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Secondary: <span className="font-semibold text-foreground">{ai?.secondary_identity || 'Balanced Academic Core'}</span> | Category: <span className="font-bold text-accent">{dna.profile_type}</span>
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-4 shrink-0 bg-card/40 border border-border/50 rounded-2xl p-4 shadow-xl">
          <div className="text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">SPI Index</p>
            <p className="text-4xl font-black text-primary mt-1">{parseFloat(scores.spi_score).toFixed(1)}</p>
          </div>
          <div className="h-10 w-[1px] bg-border/80" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">Rank Status</p>
            <p className="text-base font-black text-foreground mt-2">{potential?.status_label || 'Consistent'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + SPI Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Capability Radar Visualizer */}
        <div className="col-span-12 lg:col-span-7 glass rounded-[2.5rem] p-8 card-premium flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold tracking-tight text-foreground">10-Dimensional Capability Radar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Comprehensive representation of student performance and soft-skills.</p>
          </div>
          <div className="h-80 w-full flex-1 flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--border)" strokeWidth={1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: '700' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 8 }} />
                <Radar name="Capability" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} strokeWidth={3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SPI Growth Timeline and Stats */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* SPI potential metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-[2rem] p-5 card-premium flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">SPI Standings</p>
                <p className="text-3xl font-black text-primary mt-2">Top {potential ? (100 - potential.peer_percentile).toFixed(0) : '20'}%</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 italic">SPI rank out of total academic cohort.</p>
            </div>
            
            <div className="glass rounded-[2rem] p-5 card-premium flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">Placement Probability</p>
                <p className="text-3xl font-black text-accent mt-2">{(ai?.placement_probability || scores.placement_score).toFixed(0)}%</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 italic">Heuristic index including backlogs and GPA.</p>
            </div>
          </div>

          {/* Growth Timeline Chart */}
          <div className="glass rounded-[2rem] p-6 card-premium flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-foreground">Semester SPI Trajectory</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Calculated composite potential over semesters.</p>
            </div>
            <div className="h-44 w-full mt-4">
              {potential?.growth_history && potential.growth_history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={potential.growth_history}>
                    <defs>
                      <linearGradient id="colorSpi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                    <XAxis dataKey="semester" tickFormatter={(val) => `Sem ${val}`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--card)' }} />
                    <Area type="monotone" dataKey="spi_score" name="SPI" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSpi)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                  Academics timeline pending next semester cycle.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* AI Qualitative Summary & Explanation */}
      <div className="glass rounded-[2.5rem] p-8 card-premium space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mt-32" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">AI Intelligence Briefing</h3>
            <p className="text-xs text-muted-foreground">Deep qualitative analysis generated by NVIDIA AI.</p>
          </div>
        </div>
        <div className="text-sm leading-7 text-muted-foreground/90 space-y-4 max-w-4xl relative z-10">
          {ai?.ai_summary ? (
            ai.ai_summary.split('\n\n').map((paragraph, index) => (
              <p key={index} className="indent-4">{paragraph}</p>
            ))
          ) : (
            <p className="italic text-muted-foreground">Detailed intelligence brief is currently generating. Click standard refresh if pending.</p>
          )}
        </div>
      </div>

      {/* Strengths & Weaknesses (Areas of Growth) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Strengths */}
        <div className="glass rounded-[2rem] p-6 card-premium space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={18} />
            </div>
            <h4 className="font-bold text-foreground">Core Performance Strengths</h4>
          </div>
          <ul className="space-y-3">
            {ai?.strengths && ai.strengths.length > 0 ? (
              ai.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-snug">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground text-xs italic">Analytical strengths checklist pending load.</li>
            )}
          </ul>
        </div>

        {/* Areas of Growth */}
        <div className="glass rounded-[2rem] p-6 card-premium space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp size={18} />
            </div>
            <h4 className="font-bold text-foreground">ASIE Growth Opportunities</h4>
          </div>
          <ul className="space-y-3">
            {ai?.weaknesses && ai.weaknesses.length > 0 ? (
              ai.weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-snug">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>{weak}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground text-xs italic">Developmental opportunities checklist pending load.</li>
            )}
          </ul>
        </div>

      </div>

      {/* Career Suitability Analysis */}
      <div className="glass rounded-[2.5rem] p-8 card-premium space-y-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Predicted Career Domain Match</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Weighted capability heuristics mapped against job industry suitability.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {ai?.career_fit && ai.career_fit.length > 0 ? (
            ai.career_fit.map((fit, idx) => (
              <div key={idx} className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-3 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{fit.domain}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black tracking-wider">
                    {fit.match_percentage.toFixed(0)}% Match
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
                    style={{ width: `${fit.match_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-2">
                  {fit.explanation}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-xs text-muted-foreground italic">
              Domain matching matrix pending AI sync.
            </div>
          )}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="glass rounded-[2.5rem] p-8 card-premium space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Developmental Action Items</h3>
            <p className="text-xs text-muted-foreground">Actionable pathways generated by the ASIE recommendation engine.</p>
          </div>
        </div>
        <div className="space-y-4">
          {ai?.recommendations && ai.recommendations.length > 0 ? (
            ai.recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4">
                <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                  {rec}
                </p>
              </div>
            ))
          ) : (
            <p className="italic text-muted-foreground text-xs">No actionable items generated yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
