export type PerformanceClassification = 'At Risk' | 'Average' | 'Good' | 'Excellent';

export interface StudentPerformanceMetrics {
  student_marks: number;
  percentile: number;
  normalized_score: number; // student_marks / subject_average
  classification: PerformanceClassification;
}

export interface SubjectPerformanceConfig {
  pass_threshold: number;
  percentile_ranges: {
    at_risk_max: 30;
    average_max: 60;
    good_max: 85;
  };
}

export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface DepartmentHealth {
  overall_health_score: number;
  active_students: number;
  at_risk_count: number;
  average_attendance: number;
  average_gpa: number;
  department_name: string;
  daily_briefing: string;
  semester_trends: Array<Record<string, unknown>>;
  top_critical_subjects: Array<Record<string, unknown>>;
}

export interface SubjectBottleneckItem {
  subject_code: string;
  subject_name: string;
  semester?: number | null;
  attempts: number;
  failure_rate: number;
  marks_stddev: number;
  current_average_marks: number;
  historical_five_year_average: number;
  drift_from_history: number;
  faculty_context?: string | null;
}

export interface FacultyImpactMatrixItem {
  faculty_id: number;
  faculty_name: string;
  subject_code: string;
  subject_name: string;
  student_count: number;
  failure_rate: number;
  subject_failure_rate: number;
  cohort_delta: number;
  average_marks: number;
  impact_label: string;
}

export interface StaffProfile {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  department?: string | null;
  created_at?: string | null;
}

export interface PlacementCandidate {
  roll_no: string;
  student_name: string;
  batch?: string | null;
  current_semester?: number | null;
  cgpa: number;
  active_arrears: number;
  coding_subject_score: number;
  attendance_percentage: number;
  placement_ready: boolean;
}

export interface SpotlightResult {
  entity_type: 'student' | 'faculty' | 'subject';
  entity_id: string;
  label: string;
  sublabel?: string | null;
}

export interface AdminRiskSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface AdminPlacementSummary {
  ready_count: number;
  almost_ready_count: number;
  blocked_count: number;
  avg_coding_score: number;
}

export interface AdminLeaderboardSnapshot {
  subject_code: string;
  subject_name: string;
  semester?: number | null;
  attempts: number;
  top_score: number;
  median_score: number;
  score_spread: number;
}

export interface AdminSubjectCoverage {
  semester: number;
  total_subjects: number;
  ranked_subjects: number;
  total_records: number;
}

export interface AdminCohortAction {
  title: string;
  detail: string;
  metric: string;
  tone: 'positive' | 'warning' | 'critical' | 'info';
}

export interface AdminDirectoryStudent {
  id?: number;
  roll_no: string;
  reg_no?: string | null;
  name: string;
  city?: string | null;
  email?: string | null;
  phone_primary?: string | null;
  batch?: string | null;
  current_semester?: number | null;
  section?: string | null;
  marks_count: number;
  attendance_count: number;
  attendance_percentage: number;
  average_grade_points: number;
  average_internal_percentage: number;
  backlogs: number;
  rank?: number | null;
  is_initial_password: boolean;
}

export interface AdminDirectoryPage {
  items: AdminDirectoryStudent[];
  pagination: PaginationMeta;
}

export interface ContactInfoRecord {
  address?: string | null;
  pincode?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  phone_tertiary?: string | null;
  email?: string | null;
  city?: string | null;
}

export interface FamilyDetailsRecord {
  parent_guardian_name?: string | null;
  occupation?: string | null;
  parent_phone?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  parent_occupation?: string | null;
  parent_address?: string | null;
  parent_email?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_address?: string | null;
  emergency_contact_email?: string | null;
}

export interface PreviousAcademicRecord {
  school_name?: string | null;
  institution?: string | null;
  board_university?: string | null;
  passing_year?: string | null;
  percentage?: number | null;
}

export interface CounselorDiaryRecord {
  semester?: number | null;
  meeting_date?: string | null;
  remark_category?: string | null;
  remarks?: string | null;
  action_planned?: string | null;
  follow_up_date?: string | null;
  counselor_name?: string | null;
  created_at?: string | null;
}

export interface SemesterGradeRecord {
  semester?: number | null;
  subject_code?: string | null;
  subject_name?: string | null;
  subject_title?: string | null;
  credits?: number | null;
  grade?: string | null;
  marks?: number | null;
  internal_marks?: number | null;
  attempt?: number | null;
  remarks?: string | null;
  grade_point?: number | null;
}

export interface InternalMarkRecord {
  semester?: number | null;
  test_number?: number | null;
  percentage?: number | null;
  subject_code?: string | null;
  subject_title?: string | null;
}

export interface StudentRecordHealth {
  completion_percentage: number;
  available_sections: string[];
  missing_sections: string[];
  last_counselor_update?: string | null;
  latest_activity_year?: string | null;
}

export interface StudentAcademicSnapshot {
  semesters_tracked: number;
  grade_entries: number;
  internal_tests: number;
  previous_qualifications: number;
  cgpa_proxy: number;
  best_grade?: string | null;
  needs_attention: boolean;
}

export interface FullStudentRecord {
  roll_no: string;
  core_profile?: AdminDirectoryStudent | null;
  contact_info?: ContactInfoRecord | null;
  family_details?: FamilyDetailsRecord | null;
  previous_academics: PreviousAcademicRecord[];
  counselor_diary: CounselorDiaryRecord[];
  semester_grades: SemesterGradeRecord[];
  internal_marks?: InternalMarkRecord[];
  record_health?: StudentRecordHealth | null;
  academic_snapshot?: StudentAcademicSnapshot | null;
}

export interface AdminCommandCenterResponse {
  daily_briefing: string;
  department_health: DepartmentHealth;
  alerts: string[];
  bottlenecks: SubjectBottleneckItem[];
  faculty_impact: FacultyImpactMatrixItem[];
  placement_ready: PlacementCandidate[];
  spotlight_results: SpotlightResult[];
  top_performers: any[];
  attendance_defaulters: any[];
  internal_defaulters: any[];
  backlog_clusters: any[];
  opportunity_students: any[];
  watchlist_students: RiskRegistryResponse['items'];
  batch_health: any[];
  semester_pulse: any[];
  risk_summary: AdminRiskSummary;
  placement_summary: AdminPlacementSummary;
  leaderboard_snapshots: AdminLeaderboardSnapshot[];
  subject_coverage: AdminSubjectCoverage[];
  action_queue: AdminCohortAction[];
  quick_actions: string[];
  subject_catalog: SubjectCatalogItem[];
}

export interface LeaderboardEntry {
  roll_no: string;
  student_name: string;
  section?: string | null;
  batch?: string | null;
  current_semester?: number | null;
  subject_code: string;
  subject_name: string;
  total_marks: number;
  internal_marks: number;
  grade?: string | null;
  class_rank: number;
  batch_rank: number;
  percentile: number;
}

export interface SubjectLeaderboardResponse {
  subject_code: string;
  subject_name: string;
  top_leaderboard: LeaderboardEntry[];
  bottom_leaderboard: LeaderboardEntry[];
  pagination: PaginationMeta;
}

export interface SubjectCatalogItem {
  id: number;
  subject_code: string;
  subject_name: string;
  semester?: number | null;
  records: number;
  is_active: boolean;
  // Threshold configuration for performance analytics
  pass_threshold?: number | null; // Minimum marks to pass (e.g., 40)
  percentile_excellent?: number | null; // e.g., 85
  percentile_good?: number | null;      // e.g., 60
  percentile_average?: number | null;   // e.g., 30
}

export interface StudentSkillDomainScore {
  domain: string;
  score: number;
  cohort_score?: number;
}

export interface StudentSubjectHighlight {
  subject_code: string;
  subject_name: string;
  semester: number;
  grade?: string | null;
  total_marks: number;
  internal_marks: number;
  score: number;
  note: string;
}

export interface StudentPeerBenchmark {
  cohort_size: number;
  class_rank: number;
  percentile: number;
  cohort_avg_gpa: number;
  gap_from_cohort: number;
}

export interface StudentRiskDriver {
  label: string;
  value: number;
  status: 'positive' | 'warning' | 'critical' | 'neutral';
}

export interface StudentSemesterVelocity {
  semester: number;
  sgpa: number;
  previous_sgpa?: number | null;
  velocity?: number | null;
  attendance_pct: number;
  internal_avg: number;
}

export interface ProfessionalProfileSummary {
  github_username?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  leetcode_username?: string | null;
  hackerrank_username?: string | null;
  primary_domain?: string | null;
  bio?: string | null;
  profile_completion_score?: number | null;
}

export interface ProjectSummaryItem {
  project_id: number;
  title: string;
  tech_stack?: string[] | null;
  github_url?: string | null;
  complexity_level?: string | null;
  completion_status?: string | null;
  verification_status?: string | null;
}

export interface SkillSummaryItem {
  skill_name: string;
  category?: string | null;
  proficiency_level?: string | null;
}

export interface CertSummaryItem {
  title: string;
  provider?: string | null;
  verification_status?: string | null;
}

export interface GitHubAnalysisSummary {
  public_repos: number;
  followers: number;
  total_stars: number;
  top_languages?: Record<string, number> | null;
  contribution_activity?: string | null;
}

export interface CareerReadinessSummary {
  readiness_band?: string | null;
  total_projects: number;
  total_skills: number;
  total_certifications: number;
  ai_career_readiness_score?: number | null;
  has_github: boolean;
  has_resume: boolean;
}

export interface AIInsightSummary {
  ai_summary?: string | null;
  strengths?: string[] | null;
  improvement_areas?: string[] | null;
  career_fit_roles?: Array<Record<string, unknown>> | null;
}

export interface Student360Profile {
  student_id?: number | null;
  roll_no: string;
  reg_no?: string | null;
  student_name: string;
  batch?: string | null;
  section?: string | null;
  current_semester?: number | null;
  overall_gpa: number;
  attendance_percentage: number;
  gpa_trend: 'Rising' | 'Stable' | 'Falling';
  gpa_velocity: number;
  attendance_marks_correlation: number | null;
  active_arrears: number;
  risk_level: RiskLevel;
  attendance_band: string;
  placement_signal: string;
  skill_domains: StudentSkillDomainScore[];
  semester_velocity: StudentSemesterVelocity[];
  strongest_subjects: StudentSubjectHighlight[];
  support_subjects: StudentSubjectHighlight[];
  peer_benchmark: StudentPeerBenchmark;
  risk_drivers: StudentRiskDriver[];
  recommended_actions: string[];
  professional_profile?: ProfessionalProfileSummary | null;
  professional_projects?: ProjectSummaryItem[];
  professional_skills?: SkillSummaryItem[];
  professional_certifications?: CertSummaryItem[];
  github_analysis?: GitHubAnalysisSummary | null;
  career_readiness?: CareerReadinessSummary | null;
  ai_insights?: AIInsightSummary | null;
  capability_scores?: CapabilityScoreSummary | null;
}

export interface CapabilityScoreSummary {
  academic_score?: number | null;
  technical_score?: number | null;
  leadership_score?: number | null;
  sports_score?: number | null;
  creativity_score?: number | null;
  discipline_score?: number | null;
  communication_score?: number | null;
  consistency_score?: number | null;
  placement_score?: number | null;
  growth_score?: number | null;
  spi_score?: number | null;
  profile_type?: string | null;
}

export interface RiskRegistryResponse {
  items: Array<{
    roll_no: string;
    name: string;
    risk_score: number;
    attendance_factor: number;
    internal_marks_factor: number;
    gpa_drop_factor: number;
    is_at_risk: boolean;
    risk_level: RiskLevel;
    alerts: string[];
  }>;
  pagination: PaginationMeta;
}

export interface TimetableEntry {
  id: number;
  batch: string;
  section: string;
  day_of_week: number;
  period: number;
  subject_id?: number | null;
  faculty_id?: number | null;
  academic_year: string;
  semester: number;
  subject_name?: string | null;
  subject_code?: string | null;
  faculty_name?: string | null;
}

export interface TimetableListResponse {
  items: TimetableEntry[];
  total: number;
  batch?: string | null;
  section?: string | null;
}
