import React from 'react';
import { ShieldCheck, ArrowRight, Lightbulb } from 'lucide-react';
import type { CareerReadiness } from '../types';

interface CareerReadinessBannerProps {
  readiness: CareerReadiness;
}

export const CareerReadinessBanner: React.FC<CareerReadinessBannerProps> = ({ readiness }) => {
  const getBandStyles = (band: string) => {
    switch (band) {
      case 'Ready':
        return {
          bg: 'from-emerald-500/10 via-background to-emerald-500/5',
          border: 'border-emerald-500/30',
          text: 'text-emerald-500',
          badgeBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
        };
      case 'Near Ready':
        return {
          bg: 'from-primary/10 via-background to-primary/5',
          border: 'border-primary/30',
          text: 'text-primary',
          badgeBg: 'bg-primary/20',
          iconColor: 'text-primary-active',
        };
      case 'Building':
        return {
          bg: 'from-amber-500/10 via-background to-amber-500/5',
          border: 'border-amber-500/30',
          text: 'text-amber-500',
          badgeBg: 'bg-amber-500/20',
          iconColor: 'text-amber-400',
        };
      default:
        return {
          bg: 'from-rose-500/10 via-background to-rose-500/5',
          border: 'border-rose-500/30',
          text: 'text-rose-500',
          badgeBg: 'bg-rose-500/20',
          iconColor: 'text-rose-400',
        };
    }
  };

  const styles = getBandStyles(readiness.readiness_band);

  return (
    <div className={`glass rounded-[2rem] p-6 border ${styles.border} bg-gradient-to-r ${styles.bg} relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-premium`}>
      <div className="flex items-start gap-4">
        <div className={`p-3.5 rounded-2xl ${styles.badgeBg} ${styles.text} shrink-0 animate-pulse`}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-extrabold tracking-tight">Career Readiness Standing</h3>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${styles.badgeBg} ${styles.text}`}>
              {readiness.readiness_band} Status
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-2.5">
            <span>💻 Projects: {readiness.total_projects} ({readiness.verified_projects} Verified)</span>
            <span>⭐ Skills: {readiness.total_skills} ({readiness.verified_skills} Rated)</span>
            <span>📜 Certifications: {readiness.total_certifications}</span>
            <span>🎯 Score: {readiness.profile_completion_score}%</span>
          </div>
        </div>
      </div>

      {readiness.recommended_next_steps && readiness.recommended_next_steps.length > 0 && (
        <div className="w-full md:w-auto md:max-w-md p-4 bg-black/10 rounded-2xl border border-border/30 z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
            <Lightbulb size={12} className="text-amber-500" /> Recommended Action Items
          </p>
          <ul className="space-y-1.5 text-xs font-semibold text-foreground/80">
            {readiness.recommended_next_steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight size={12} className="text-primary mt-0.5 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
