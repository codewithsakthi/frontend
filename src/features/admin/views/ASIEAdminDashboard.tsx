import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Search,
  Sparkles,
  Users,
  AlertTriangle,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingDown,
  Cpu,
  Bookmark,
  Award,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { RobustResponsiveContainer as ResponsiveContainer } from "../../../components/RobustResponsiveContainer";
import api from "../../../api/client";

// Define TypeScript interfaces for backend responses
interface AdminTalentMatrixItem {
  roll_no: string;
  name: string;
  academic_score: number;
  spi_score: number;
  profile_type: string;
  quadrant: string;
  cgpa: number;
  profile_completion_score?: number | null;
  projects_count?: number;
  skills_count?: number;
  certifications_count?: number;
  career_readiness_score?: number | null;
  github_connected?: boolean;
}

interface AdminTalentMatrixResponse {
  items: AdminTalentMatrixItem[];
  quadrant_counts: Record<string, number>;
}

interface AdminHiddenTalentItem {
  roll_no: string;
  name: string;
  cgpa: number;
  technical_score: number;
  leadership_score: number;
  sports_score: number;
  creativity_score: number;
  extra_curricular_count: number;
  highlight_reason: string;
}

interface AdminHiddenTalentsResponse {
  items: AdminHiddenTalentItem[];
}

interface AdminInterventionItem {
  roll_no: string;
  name: string;
  cgpa: number;
  attendance_percentage: number;
  academic_score: number;
  discipline_score: number;
  profile_type: string;
  suggested_action: string;
  risk_level: string;
}

interface AdminInterventionResponse {
  items: AdminInterventionItem[];
}

interface CareerDistributionItem {
  domain: string;
  count: number;
  percentage: number;
}

interface AdminCareerDistributionResponse {
  distribution: CareerDistributionItem[];
}

interface ASIEAdminDashboardProps {
  onOpenStudentProfile: (rollNo: string) => void;
}

// 9-box cell metadata definition
interface BoxConfig {
  title: string;
  description: string;
  x: "Low" | "Medium" | "High";
  y: "Low" | "Medium" | "High";
  gradient: string;
  borderClass: string;
  icon: string;
}

const BOX_METADATA: Record<string, BoxConfig> = {
  "Star Performer": {
    title: "Star Performer",
    description: "Exceptional Academics & High SPI Potential",
    x: "High",
    y: "High",
    gradient: "from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20",
    borderClass: "border-indigo-500/50 dark:border-indigo-400/50 shadow-indigo-500/10",
    icon: "🌟"
  },
  "Academic Pillar": {
    title: "Academic Pillar",
    description: "Consistent academic results with average SPI growth",
    x: "High",
    y: "Medium",
    gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    borderClass: "border-emerald-500/40 dark:border-emerald-400/40 shadow-emerald-500/5",
    icon: "📚"
  },
  "Curriculum Specialist": {
    title: "Curriculum Specialist",
    description: "Strong test performance but needs leadership/soft-skills expansion",
    x: "High",
    y: "Low",
    gradient: "from-cyan-500/10 to-sky-500/10 dark:from-cyan-500/20 dark:to-sky-500/20",
    borderClass: "border-cyan-500/40 dark:border-cyan-400/40 shadow-cyan-500/5",
    icon: "🔬"
  },
  "High Potential Leader": {
    title: "High Potential Leader",
    description: "Excellent multi-dimensional growth with solid academics",
    x: "Medium",
    y: "High",
    gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20",
    borderClass: "border-purple-500/40 dark:border-purple-400/40 shadow-purple-500/5",
    icon: "⚡"
  },
  "Balanced Core": {
    title: "Balanced Core",
    description: "Stable, well-rounded performer across all dimensions",
    x: "Medium",
    y: "Medium",
    gradient: "from-slate-500/10 to-blue-500/10 dark:from-slate-500/20 dark:to-blue-500/20",
    borderClass: "border-border/80 shadow-slate-500/5",
    icon: "🎯"
  },
  "Solid Contributor": {
    title: "Solid Contributor",
    description: "Reliable academic baseline; good candidate for technical specialization",
    x: "Medium",
    y: "Low",
    gradient: "from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10",
    borderClass: "border-blue-500/30 dark:border-blue-400/30",
    icon: "🔧"
  },
  "Hidden Talent": {
    title: "Hidden Talent",
    description: "Stellar extracurriculars or leadership despite low CGPA proxy",
    x: "Low",
    y: "High",
    gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
    borderClass: "border-amber-500/40 dark:border-amber-400/40 shadow-amber-500/5",
    icon: "💎"
  },
  "Growth Candidate": {
    title: "Growth Candidate",
    description: "Showing positive growth vectors; needs focused technical mentorship",
    x: "Low",
    y: "Medium",
    gradient: "from-orange-500/5 to-rose-500/5 dark:from-orange-500/10 dark:to-rose-500/10",
    borderClass: "border-orange-500/30 dark:border-orange-400/30",
    icon: "📈"
  },
  "Needs Developmental Support": {
    title: "Needs Support",
    description: "At risk across both academics & discipline; priority intervention",
    x: "Low",
    y: "Low",
    gradient: "from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20",
    borderClass: "border-rose-500/40 dark:border-rose-400/40 shadow-rose-500/5",
    icon: "🚨"
  }
};

const CHART_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#f97316", // Orange
  "#ef4444"  // Red
];

export default function ASIEAdminDashboard({ onOpenStudentProfile }: ASIEAdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"matrix" | "hidden" | "high-potential" | "intervention" | "careers">("matrix");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  // TanStack Queries for live, optimized data fetch
  const { data: talentData, isLoading: talentLoading, error: talentError, refetch: refetchTalent } = useQuery<AdminTalentMatrixResponse>({
    queryKey: ["admin-asie-talent-matrix"],
    queryFn: () => api.get("admin/talent-matrix") as Promise<AdminTalentMatrixResponse>,
    staleTime: 30000
  });

  const { data: hiddenData, isLoading: hiddenLoading } = useQuery<AdminHiddenTalentsResponse>({
    queryKey: ["admin-asie-hidden-talents"],
    queryFn: () => api.get("admin/hidden-talents") as Promise<AdminHiddenTalentsResponse>,
    staleTime: 30000
  });

  const { data: highPotentialData, isLoading: highPotentialLoading } = useQuery<AdminTalentMatrixResponse>({
    queryKey: ["admin-asie-high-potential"],
    queryFn: () => api.get("admin/high-potential") as Promise<any>,
    staleTime: 30000
  });

  const { data: interventionData, isLoading: interventionLoading } = useQuery<AdminInterventionResponse>({
    queryKey: ["admin-asie-intervention"],
    queryFn: () => api.get("admin/intervention-engine") as Promise<AdminInterventionResponse>,
    staleTime: 30000
  });

  const { data: careerData, isLoading: careerLoading } = useQuery<AdminCareerDistributionResponse>({
    queryKey: ["admin-asie-career-distribution"],
    queryFn: () => api.get("admin/career-distribution") as Promise<AdminCareerDistributionResponse>,
    staleTime: 30000
  });

  // Calculate cohort summaries based on loaded data
  const matrixItems = talentData?.items || [];
  const quadrantCounts = talentData?.quadrant_counts || {};

  const filteredMatrixItems = useMemo(() => {
    return matrixItems.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        student.roll_no.toLowerCase().includes(matrixSearch.toLowerCase());
      
      const matchesQuadrant = selectedQuadrant ? student.quadrant === selectedQuadrant : true;
      
      return matchesSearch && matchesQuadrant;
    });
  }, [matrixItems, matrixSearch, selectedQuadrant]);

  // Map 9-box cells dynamically
  const cellsMap = useMemo(() => {
    const map: Record<string, AdminTalentMatrixItem[]> = {};
    Object.keys(BOX_METADATA).forEach((key) => {
      map[key] = [];
    });
    matrixItems.forEach((item) => {
      if (map[item.quadrant]) {
        map[item.quadrant].push(item);
      } else {
        // Fallback for custom labels
        const normalized = item.quadrant === "Needs Developmental Support" ? "Needs Developmental Support" : item.quadrant;
        if (map[normalized]) {
          map[normalized].push(item);
        }
      }
    });
    return map;
  }, [matrixItems]);

  const totalStudents = matrixItems.length;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="glass rounded-[2rem] p-6 sm:p-8 card-premium flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles size={24} className="animate-pulse" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              AI Student Intelligence Engine (ASIE)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Multi-dimensional institutional evaluation. SPARK bypasses raw CGPA filters to profile core competence, technical capability, sports excellence, career readiness, and hidden leadership traits.
          </p>
        </div>

        {/* Quick Cohort Analytics Panel */}
        <div className="flex flex-wrap gap-2 sm:gap-4 self-stretch md:self-auto justify-between md:justify-start">
          <div className="glass border border-border/40 rounded-2xl px-4 py-3 flex-1 min-w-[85px] sm:min-w-[100px] text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Students Plotted</p>
            <p className="text-2xl font-black text-primary mt-1">{totalStudents}</p>
          </div>
          <div className="glass border border-border/40 rounded-2xl px-4 py-3 flex-1 min-w-[85px] sm:min-w-[100px] text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">High SPI (Stars)</p>
            <p className="text-2xl font-black text-emerald-500 mt-1">
              {(quadrantCounts["Star Performer"] || 0) + (quadrantCounts["High Potential Leader"] || 0)}
            </p>
          </div>
          <div className="glass border border-border/40 rounded-2xl px-4 py-3 flex-1 min-w-[85px] sm:min-w-[100px] text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Under Mentorship</p>
            <p className="text-2xl font-black text-rose-500 mt-1">
              {quadrantCounts["Needs Developmental Support"] || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex w-full overflow-x-auto no-scrollbar scroll-smooth gap-2 p-1.5 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:w-fit">
        <button
          onClick={() => { setActiveSubTab("matrix"); setSelectedQuadrant(null); }}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeSubTab === "matrix"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers size={14} />
          9-Box Talent Matrix
        </button>
        <button
          onClick={() => setActiveSubTab("hidden")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeSubTab === "hidden"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Award size={14} />
          Hidden Talent Discovery
        </button>
        <button
          onClick={() => setActiveSubTab("high-potential")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeSubTab === "high-potential"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <TrendingUp size={14} />
          High-Potential Cohort
        </button>
        <button
          onClick={() => setActiveSubTab("intervention")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeSubTab === "intervention"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <AlertTriangle size={14} />
          Intervention Engine
        </button>
        <button
          onClick={() => setActiveSubTab("careers")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeSubTab === "careers"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Briefcase size={14} />
          Career Suitability
        </button>
      </div>

      {/* Main Content Area */}
      {talentLoading && (
        <div className="glass rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground font-medium">Assembling multi-dimensional cohort intelligence...</p>
        </div>
      )}

      {talentError && (
        <div className="glass rounded-[2rem] p-12 text-center min-h-[300px] flex flex-col items-center justify-center space-y-4">
          <AlertTriangle size={48} className="text-rose-500 animate-bounce" />
          <h3 className="text-lg font-bold text-foreground">Analytics Assembly Interrupted</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The system encountered an error loading the student intelligence scores. Verify that PostgreSQL contains the ASIE tables and migrations are up to date.
          </p>
          <button onClick={() => refetchTalent()} className="btn-primary px-6 py-2.5 text-xs font-bold uppercase">
            Retry Extraction
          </button>
        </div>
      )}

      {!talentLoading && !talentError && (
        <>
          {/* TAB 1: 9-BOX TALENT MATRIX */}
          {activeSubTab === "matrix" && (
            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6">
              {/* The 9-Box Grid Layout */}
              <div className="col-span-1 xl:col-span-8 space-y-6 min-w-0 w-full">
                <article className="panel relative overflow-hidden">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground">Institutional 9-Box Talent Matrix</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Plotting Academic Score (X-Axis) vs Student Potential Index (Y-Axis). Click any cell to filter the registry below.
                    </p>
                  </div>

                  {/* Grid Container */}
                  <div className="relative p-2">
                    {/* Y-Axis Label */}
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
                      <span>Potential (SPI Score)</span>
                    </div>
                    
                    {/* Responsive Horizontally Scrollable Wrapper */}
                    <div className="w-full overflow-x-auto scrollbar-thin pb-2 ml-2">
                      {/* The 3x3 Grid */}
                      <div className="grid grid-cols-3 gap-3 min-w-[650px] md:min-w-0">
                      {/* Row 1: High Potential (Y-axis: High) */}
                      {/* Cell Top-Left: Hidden Talent (High Potential, Low Academics) */}
                      {(() => {
                        const boxName = "Hidden Talent";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: High | Acad: Low</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Top-Middle: High Potential Leader (High Potential, Med Academics) */}
                      {(() => {
                        const boxName = "High Potential Leader";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: High | Acad: Med</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Top-Right: Star Performer (High Potential, High Academics) */}
                      {(() => {
                        const boxName = "Star Performer";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: High | Acad: High</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Row 2: Medium Potential (Y-axis: Medium) */}
                      {/* Cell Mid-Left: Growth Candidate (Med Potential, Low Academics) */}
                      {(() => {
                        const boxName = "Growth Candidate";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Med | Acad: Low</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Mid-Middle: Balanced Core (Med Potential, Med Academics) */}
                      {(() => {
                        const boxName = "Balanced Core";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Med | Acad: Med</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Mid-Right: Academic Pillar (Med Potential, High Academics) */}
                      {(() => {
                        const boxName = "Academic Pillar";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Med | Acad: High</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Row 3: Low Potential (Y-axis: Low) */}
                      {/* Cell Bot-Left: Needs Developmental Support (Low Potential, Low Academics) */}
                      {(() => {
                        const boxName = "Needs Developmental Support";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Low | Acad: Low</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Bot-Middle: Solid Contributor (Low Potential, Med Academics) */}
                      {(() => {
                        const boxName = "Solid Contributor";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Low | Acad: Med</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                      {/* Cell Bot-Right: Curriculum Specialist (Low Potential, High Academics) */}
                      {(() => {
                        const boxName = "Curriculum Specialist";
                        const conf = BOX_METADATA[boxName];
                        const count = cellsMap[boxName]?.length || 0;
                        const isSelected = selectedQuadrant === boxName;
                        return (
                          <button
                            onClick={() => setSelectedQuadrant(isSelected ? null : boxName)}
                            className={`glass border rounded-2xl p-4 text-left transition-all duration-300 relative group flex flex-col justify-between min-h-[120px] ${conf.gradient} ${conf.borderClass} ${
                              isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl" : "hover:scale-[1.01] hover:shadow-lg"
                            }`}
                          >
                            <span className="absolute top-2 right-3 text-lg">{conf.icon}</span>
                            <div>
                              <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors pr-6 leading-tight">{conf.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{conf.description}</p>
                            </div>
                            <div className="flex items-baseline justify-between mt-4">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential: Low | Acad: High</span>
                              <span className="text-lg font-black text-foreground">{count}</span>
                            </div>
                          </button>
                        );
                      })()}

                    </div>
                    </div>

                    {/* X-Axis Label */}
                    <div className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
                      Academic Score (Performance)
                    </div>
                  </div>
                </article>
              </div>

              {/* Dynamic Cohort Panel (Right Side) */}
              <div className="col-span-1 xl:col-span-4 space-y-6 min-w-0 w-full">
                <article className="panel flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Cpu className="text-primary" size={18} />
                      <h3 className="text-base font-bold text-foreground">ASIE Distribution Heuristic</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rather than rating students purely by test averages, the engine runs weighted algorithms to calculate soft skills, sports performance, counselor growth remarks, and attendance consistency.
                    </p>

                    <div className="space-y-4 mt-6">
                      {Object.entries(BOX_METADATA).map(([quadKey, metadata]) => {
                        const count = cellsMap[quadKey]?.length || 0;
                        const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                        if (count === 0) return null;

                        return (
                          <div key={quadKey} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <span className="text-[10px]">{metadata.icon}</span>
                                {metadata.title}
                              </span>
                              <span className="text-muted-foreground font-mono font-bold">
                                {count} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                              <div
                                className={`h-full bg-primary/80 transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 border-t border-border/50 pt-4 text-xs text-muted-foreground leading-relaxed flex items-center gap-2 bg-muted/5 p-3 rounded-xl border border-dashed border-border/70">
                    <span className="text-lg">⚖️</span>
                    <span>
                      <strong>Ethical Safeguard:</strong> ASIE suppresses negative branding. Students needing help are labeled as <em>Developmental Support</em>, linking to supportive intervention items.
                    </span>
                  </div>
                </article>
              </div>

              {/* Quadrant Detail List (Cohort Registry) */}
              <div className="col-span-12">
                <article className="panel space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {selectedQuadrant ? `Cohort Registry: ${selectedQuadrant}` : "ASIE Cohort Registry"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedQuadrant
                          ? `Displaying all ${filteredMatrixItems.length} students classified within the "${selectedQuadrant}" quadrant.`
                          : "Displaying the complete institutional registry. Click on cells above to filter by talent category."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="relative w-full sm:w-auto">
                        <input
                          value={matrixSearch}
                          onChange={(e) => setMatrixSearch(e.target.value)}
                          className="input-field !py-2 w-full sm:w-60 pl-10 text-xs"
                          placeholder="Search student or roll no..."
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      </div>
                      {selectedQuadrant && (
                        <button
                          onClick={() => setSelectedQuadrant(null)}
                          className="tab-chip !py-2 text-[10px] uppercase font-black"
                        >
                          Clear Cell Filter
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Student Profile</th>
                          <th className="px-4 py-3 text-left">Academic Score</th>
                          <th className="px-4 py-3 text-left">SPI Score</th>
                          <th className="px-4 py-3 text-left">CGPA Proxy</th>
                          <th className="px-4 py-3 text-center">Profile %</th>
                          <th className="px-4 py-3 text-center">Projects</th>
                          <th className="px-4 py-3 text-center">Skills</th>
                          <th className="px-4 py-3 text-center">GitHub</th>
                          <th className="px-4 py-3 text-left">Classification Quadrant</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatrixItems.map((item) => {
                          const conf = BOX_METADATA[item.quadrant] || BOX_METADATA["Balanced Core"];
                          return (
                            <tr key={item.roll_no} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={() => onOpenStudentProfile(item.roll_no)}
                                  className="text-left group"
                                >
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {item.roll_no}
                                  </p>
                                </button>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-foreground">
                                {item.academic_score.toFixed(1)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary">{item.spi_score.toFixed(1)}</span>
                                  <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${item.spi_score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-muted-foreground">
                                {item.cgpa.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`text-xs font-bold ${(item.profile_completion_score ?? 0) >= 70 ? 'text-emerald-500' : (item.profile_completion_score ?? 0) >= 40 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                  {item.profile_completion_score != null ? `${item.profile_completion_score}%` : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-foreground text-xs">
                                {item.projects_count ?? '—'}
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-foreground text-xs">
                                {item.skills_count ?? '—'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {item.github_connected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">✓</span>
                                ) : (
                                  <span className="text-muted-foreground text-[9px]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20`}>
                                  <span className="text-[10px]">{conf.icon}</span>
                                  {item.quadrant}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => onOpenStudentProfile(item.roll_no)}
                                  className="tab-chip !py-1 inline-flex items-center gap-1"
                                >
                                  360 View
                                  <ArrowUpRight size={10} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                          {filteredMatrixItems.length === 0 && (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-muted-foreground text-xs italic">
                              No students found matching filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* TAB 2: HIDDEN TALENTS */}
          {activeSubTab === "hidden" && (
            <div className="space-y-6">
              <article className="panel space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-500" size={20} />
                    <h3 className="text-lg font-bold text-foreground">Hidden Talent Discovery Portal</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This search filter targets students with a CGPA below 7.0 who show exceptional capabilities (&ge;75) in extracurriculars, leadership, sports, or creative problem solving.
                  </p>
                </div>

                {hiddenLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                    Scanning cohort profiles for hidden dimensions...
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Student Profile</th>
                          <th className="px-4 py-3 text-left">CGPA Proxy</th>
                          <th className="px-4 py-3 text-left">Technical</th>
                          <th className="px-4 py-3 text-left">Leadership</th>
                          <th className="px-4 py-3 text-left">Sports Excellence</th>
                          <th className="px-4 py-3 text-left">Creativity</th>
                          <th className="px-4 py-3 text-left">Out-of-Class Impact</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hiddenData?.items?.map((item) => (
                          <tr key={item.roll_no} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4">
                              <button onClick={() => onOpenStudentProfile(item.roll_no)} className="text-left group">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {item.roll_no}
                                </p>
                              </button>
                              <p className="text-[11px] text-primary italic max-w-[220px] sm:max-w-sm mt-1 bg-primary/5 p-2 rounded-lg border border-primary/10">
                                {item.highlight_reason}
                              </p>
                            </td>
                            <td className="px-4 py-4 font-extrabold text-rose-500">
                              {item.cgpa.toFixed(2)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.technical_score >= 75 ? "bg-emerald-500/10 text-emerald-500 font-extrabold" : "text-muted-foreground"}`}>
                                {item.technical_score.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.leadership_score >= 75 ? "bg-violet-500/10 text-violet-500 font-extrabold" : "text-muted-foreground"}`}>
                                {item.leadership_score.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.sports_score >= 75 ? "bg-cyan-500/10 text-cyan-500 font-extrabold" : "text-muted-foreground"}`}>
                                {item.sports_score.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.creativity_score >= 75 ? "bg-pink-500/10 text-pink-500 font-extrabold" : "text-muted-foreground"}`}>
                                {item.creativity_score.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-foreground">
                              {item.extra_curricular_count} events
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => onOpenStudentProfile(item.roll_no)}
                                className="tab-chip !py-1 inline-flex items-center gap-1"
                              >
                                Student 360
                                <ArrowUpRight size={10} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!hiddenData?.items || hiddenData.items.length === 0) && (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs italic">
                              No hidden talents detected in current filter guidelines.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          )}

          {/* TAB 3: HIGH-POTENTIAL COHORT */}
          {activeSubTab === "high-potential" && (
            <div className="space-y-6">
              <article className="panel space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-indigo-500" size={20} />
                    <h3 className="text-lg font-bold text-foreground">High Potential (SPI Leaderboard)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Students ranked by Student Potential Index (SPI). SPI compiles academics, Consistency, Growth trajectory, and Leadership values.
                  </p>
                </div>

                {highPotentialLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                    Compiling SPI rank list...
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Cohort Rank</th>
                          <th className="px-4 py-3 text-left">Student Profile</th>
                          <th className="px-4 py-3 text-left">CGPA</th>
                          <th className="px-4 py-3 text-left">Academic score</th>
                          <th className="px-4 py-3 text-left">Student Potential Index (SPI)</th>
                          <th className="px-4 py-3 text-left">Auto-Classification</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {highPotentialData?.items?.map((item, idx) => {
                          const isTop3 = idx < 3;
                          const rankIcon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
                          return (
                            <tr key={item.roll_no} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-4 font-mono font-bold text-foreground">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${isTop3 ? "bg-amber-500/10 text-amber-500 scale-110 font-black border border-amber-500/20" : ""}`}>
                                  {rankIcon}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button onClick={() => onOpenStudentProfile(item.roll_no)} className="text-left group">
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {item.roll_no}
                                  </p>
                                </button>
                              </td>
                              <td className="px-4 py-4 font-bold text-foreground">
                                {item.cgpa.toFixed(2)}
                              </td>
                              <td className="px-4 py-4 font-bold text-muted-foreground">
                                {item.academic_score.toFixed(1)}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-primary text-base">{item.spi_score.toFixed(1)}</span>
                                  <div className="w-24 h-2 rounded-full bg-muted/40 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-primary"
                                      style={{ width: `${item.spi_score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                                  {item.profile_type}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => onOpenStudentProfile(item.roll_no)}
                                  className="tab-chip !py-1 inline-flex items-center gap-1"
                                >
                                  Review DNA
                                  <ArrowUpRight size={10} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(!highPotentialData?.items || highPotentialData.items.length === 0) && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs italic">
                              No high potential students indexed.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          )}

          {/* TAB 4: INTERVENTION ENGINE */}
          {activeSubTab === "intervention" && (
            <div className="space-y-6">
              <article className="panel space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-rose-500 animate-pulse" size={20} />
                    <h3 className="text-lg font-bold text-foreground">Developmental Intervention Engine</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Targeted cohort diagnostic. Identifies students requiring academic or discipline support based on scores &le; 50 or critical attendance issues.
                  </p>
                </div>

                {interventionLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                    Scanning database records for critical support vectors...
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Priority</th>
                          <th className="px-4 py-3 text-left">Student Profile</th>
                          <th className="px-4 py-3 text-left">Attendance</th>
                          <th className="px-4 py-3 text-left">Academic Score</th>
                          <th className="px-4 py-3 text-left">Discipline Score</th>
                          <th className="px-4 py-3 text-left">Calculated Risk</th>
                          <th className="px-4 py-3 text-left">AI Recommended Guidance Action</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interventionData?.items?.map((item, idx) => {
                          const isCritical = item.risk_level === "Critical";
                          const isHigh = item.risk_level === "High";
                          const riskBadge = isCritical
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : isHigh
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20";
                          
                          return (
                            <tr key={item.roll_no} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-4 font-mono font-bold text-foreground">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isCritical ? "bg-rose-500 text-white font-extrabold" : "bg-muted text-muted-foreground"}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button onClick={() => onOpenStudentProfile(item.roll_no)} className="text-left group">
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {item.roll_no}
                                  </p>
                                </button>
                              </td>
                              <td className={`px-4 py-4 font-bold ${item.attendance_percentage < 75 ? "text-rose-500" : "text-foreground"}`}>
                                {item.attendance_percentage.toFixed(0)}%
                              </td>
                              <td className="px-4 py-4 font-bold text-foreground">
                                {item.academic_score.toFixed(0)}
                              </td>
                              <td className="px-4 py-4 font-bold text-foreground">
                                {item.discipline_score.toFixed(0)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${riskBadge}`}>
                                  {item.risk_level}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded-lg border border-border max-w-[220px] sm:max-w-sm">
                                  {item.suggested_action}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => onOpenStudentProfile(item.roll_no)}
                                  className="tab-chip !py-1 inline-flex items-center gap-1 hover:!bg-primary/20 hover:!text-primary"
                                >
                                  Action Logs
                                  <ArrowUpRight size={10} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(!interventionData?.items || interventionData.items.length === 0) && (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs italic">
                              No students require academic or disciplinary support interventions.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          )}

          {/* TAB 5: CAREER DISTRIBUTION */}
          {activeSubTab === "careers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart Visualization */}
              <article className="panel space-y-4 min-w-0 w-full overflow-hidden">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Aggregate Career Suitability Distributions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Predicted suitable job tracks. Computed using individual student multi-dimensional capabilities.
                  </p>
                </div>

                {careerLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                    Aggregating career fit algorithms...
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={careerData?.distribution || []}
                        margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="domain"
                          stroke="#888888"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(30, 41, 59, 0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#fff"
                          }}
                          labelStyle={{ fontWeight: "bold", color: "#818cf8" }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {(careerData?.distribution || []).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              {/* Pie Chart / Grid representation */}
              <article className="panel space-y-4 min-w-0 w-full overflow-hidden">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Target Role Segments</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Percentage breakdown of cohort talent matches. Use for curriculum design alignment.
                  </p>
                </div>

                {careerLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                    Loading segments...
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="h-60 w-60">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={careerData?.distribution || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="count"
                          >
                            {(careerData?.distribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(30, 41, 59, 0.9)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                              fontSize: "12px",
                              color: "#fff"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-3">
                      {(careerData?.distribution || []).slice(0, 5).map((item, idx) => (
                        <div key={item.domain} className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                          <span className="flex items-center gap-2 text-foreground font-medium">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            {item.domain}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {item.count} students ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
          )}
        </>
      )}
    </div>
  );
}
