// SPICS — TypeScript type definitions

export type PrimaryDomain =
  | 'frontend' | 'backend' | 'fullstack' | 'data' | 'ml'
  | 'devops' | 'mobile' | 'cybersecurity' | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AIStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'degraded' | 'disabled';
export type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced';
export type CompletionStatus = 'in_progress' | 'completed' | 'archived';
export type SkillCategory = 'programming' | 'framework' | 'database' | 'cloud' | 'tool' | 'soft_skill' | 'other';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ReadinessBand = 'Ready' | 'Near Ready' | 'Building' | 'Early Stage';

export interface ProfessionalProfile {
  student_id: number;
  github_username?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  leetcode_username?: string;
  hackerrank_username?: string;
  codechef_username?: string;
  primary_domain?: PrimaryDomain;
  bio?: string;
  career_interest?: string[];
  resume_file_path?: string;
  resume_uploaded_at?: string;
  picture_url?: string;
  linkedin_cache_data?: Record<string, unknown>;
  profile_completion_score?: number;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  project_id: number;
  student_id: number;
  title: string;
  description?: string;
  tech_stack?: string[];
  github_url?: string;
  demo_url?: string;
  role?: string;
  team_size: number;
  complexity_level?: ComplexityLevel;
  completion_status: CompletionStatus;
  start_date?: string;
  end_date?: string;
  verified_by_faculty?: number;
  verification_status: VerificationStatus;
  faculty_remarks?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Certification {
  certification_id: number;
  student_id: number;
  title: string;
  provider?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  proof_file_path?: string;
  verification_status: 'unverified' | 'verified' | 'expired';
  created_at?: string;
}

export interface CertificationCreateRequest {
  title: string;
  provider?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface CertificationUpdateRequest {
  title?: string;
  provider?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Skill {
  skill_id: number;
  student_id: number;
  skill_name: string;
  category: SkillCategory;
  proficiency_level?: ProficiencyLevel;
  self_rating?: number;
  faculty_rating?: number;
  faculty_rater_id?: number;
  verification_status: 'self_reported' | 'faculty_verified';
  years_experience?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CareerFitRole {
  role: string;
  match: 'High' | 'Medium' | 'Low';
}

export interface AIInsights {
  insight_id: number;
  student_id: number;
  technical_depth_score?: number;
  communication_score?: number;
  innovation_score?: number;
  collaboration_score?: number;
  project_maturity_score?: number;
  career_readiness_score?: number;
  ai_summary?: string;
  strengths?: string[];
  improvement_areas?: string[];
  career_fit_roles?: CareerFitRole[];
  missing_skills?: string[];
  resume_insights?: Record<string, unknown>;
  ai_status: AIStatus;
  generated_at?: string;
  model_used?: string;
  processing_time_ms?: number;
  error_detail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CareerReadiness {
  student_id: number;
  profile_completion_score: number;
  total_projects: number;
  verified_projects: number;
  total_certifications: number;
  total_skills: number;
  verified_skills: number;
  has_github: boolean;
  has_resume: boolean;
  ai_career_readiness_score?: number;
  readiness_band: ReadinessBand;
  top_skills: string[];
  recommended_next_steps: string[];
}

export interface GitHubRepo {
  name: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  url: string;
  updated_at?: string;
}

export interface GitHubAnalysis {
  student_id: number;
  github_username: string;
  public_repos: number;
  followers: number;
  following: number;
  account_created?: string;
  top_languages: Record<string, number>;
  total_stars: number;
  top_repos: GitHubRepo[];
  contribution_activity?: string;
  analysis_note?: string;
  cached: boolean;
  fetched_at?: string;
  error?: string;
}

export interface PendingVerificationItem {
  entity_type: 'project' | 'skill';
  entity_id: number;
  student_id: number;
  student_name?: string;
  roll_no?: string;
  title: string;
  status: string;
  created_at?: string;
}

export interface ProfileCreateRequest {
  github_username?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  picture_url?: string;
  leetcode_username?: string;
  hackerrank_username?: string;
  codechef_username?: string;
  primary_domain?: PrimaryDomain;
  bio?: string;
  career_interest?: string[];
  is_public?: boolean;
}

export interface ProjectCreateRequest {
  title: string;
  description?: string;
  tech_stack?: string[];
  github_url?: string;
  demo_url?: string;
  role?: string;
  team_size?: number;
  complexity_level?: ComplexityLevel;
  completion_status?: CompletionStatus;
  start_date?: string;
  end_date?: string;
}

export interface SkillCreateRequest {
  skill_name: string;
  category?: SkillCategory;
  proficiency_level?: ProficiencyLevel;
  self_rating?: number;
  years_experience?: number;
}
