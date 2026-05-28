import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Award, Zap, Layers, MessageSquare, AlertTriangle } from 'lucide-react';
import type { AIInsights } from '../types';

interface AIInsightPanelProps {
  insights: AIInsights;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ insights }) => {
  if (insights.ai_status === 'disabled') return null;

  if (insights.ai_status === 'pending' || insights.ai_status === 'processing') {
    return (
      <div className="glass rounded-[2.5rem] p-8 card-premium text-center space-y-4">
        <Sparkles className="animate-spin text-primary mx-auto" size={32} />
        <h3 className="text-lg font-bold">Refining AI Capability Matrix...</h3>
        <p className="text-sm text-muted-foreground">The AI engine is compiling your multi-dimensional score. Results will reload automatically.</p>
      </div>
    );
  }

  const dimensions = [
    { label: 'Technical Depth', score: insights.technical_depth_score, color: 'text-primary bg-primary/10', stroke: 'bg-primary' },
    { label: 'Communication Strength', score: insights.communication_score, color: 'text-accent bg-accent/10', stroke: 'bg-accent' },
    { label: 'Innovation Quotient', score: insights.innovation_score, color: 'text-emerald-500 bg-emerald-500/10', stroke: 'bg-emerald-500' },
    { label: 'Collaboration Factor', score: insights.collaboration_score, color: 'text-purple-500 bg-purple-500/10', stroke: 'bg-purple-500' },
    { label: 'Project Maturity', score: insights.project_maturity_score, color: 'text-pink-500 bg-pink-500/10', stroke: 'bg-pink-500' },
    { label: 'Career Readiness Index', score: insights.career_readiness_score, color: 'text-amber-500 bg-amber-500/10', stroke: 'bg-amber-500' },
  ];

  return (
    <div className="glass rounded-[2.5rem] p-8 card-premium space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      
      {/* Panel Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-primary" size={24} />
          <span className="px-3 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            AI Engine Active
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight">AI Capability Insights</h2>
        <p className="text-sm text-muted-foreground/80 mt-1">Multi-dimensional capability rating compiled from academic marks, certificates, and connected code contributions.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dimensions Score Matrix */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-muted/20 border border-border/50 flex flex-col justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Dimension Competency Matrix</p>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            {dimensions.map((dim, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">{dim.label}</span>
                  <span className="text-foreground">{dim.score ? `${dim.score}%` : 'Pending'}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${dim.stroke}`} style={{ width: `${dim.score ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Bio Summary */}
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Executive Summary</p>
            <p className="text-sm font-semibold leading-relaxed text-foreground/90 italic">
              "{insights.ai_summary || 'Your comprehensive professional assessment is being synthesized based on NPTEL/Coursera certificates and GitHub analytics.'}"
            </p>
          </div>
          {insights.model_used && (
            <p className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-widest mt-4">
              Model: {insights.model_used}
            </p>
          )}
        </div>

        {/* Strengths List */}
        {insights.strengths && insights.strengths.length > 0 && (
          <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Key Competencies
            </p>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              {insights.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Areas */}
        {insights.improvement_areas && insights.improvement_areas.length > 0 && (
          <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
            <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-1.5">
              <Zap size={14} /> Expansion Pathways
            </p>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              {insights.improvement_areas.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Career Fit Roles */}
        {insights.career_fit_roles && insights.career_fit_roles.length > 0 && (
          <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
            <p className="text-xs font-black uppercase tracking-widest text-purple-500 mb-4 flex items-center gap-1.5">
              <Award size={14} /> Targeted Positions
            </p>
            <div className="flex flex-wrap gap-2">
              {insights.career_fit_roles.map((role: any, i) => {
                const title = typeof role === 'string' ? role : role?.role || role?.title || 'Engineer';
                return (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wide">
                    {title}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
