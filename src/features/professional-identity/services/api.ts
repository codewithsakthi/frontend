// SPICS — API service layer (isolated from existing api/client.js)
import api from '../../../api/client';
import type {
  ProfessionalProfile, Project, Certification, Skill,
  AIInsights, CareerReadiness, GitHubAnalysis,
  ProfileCreateRequest, ProjectCreateRequest, SkillCreateRequest,
  CertificationCreateRequest, CertificationUpdateRequest,
  PendingVerificationItem,
} from '../types';

const BASE = '/professional';

// ── Profile ────────────────────────────────────────────────────────────────────
export const getProfile = (studentId: number): Promise<ProfessionalProfile> =>
  api.get(`${BASE}/profile/${studentId}`);

export const upsertProfile = (data: ProfileCreateRequest): Promise<ProfessionalProfile> =>
  api.post(`${BASE}/profile`, data);

// ── Projects ───────────────────────────────────────────────────────────────────
export const getProjects = (studentId: number): Promise<Project[]> =>
  api.get(`${BASE}/projects/${studentId}`);

export const createProject = (data: ProjectCreateRequest): Promise<Project> =>
  api.post(`${BASE}/projects`, data);

export const updateProject = (projectId: number, data: Partial<ProjectCreateRequest>): Promise<Project> =>
  api.patch(`${BASE}/projects/${projectId}`, data);

export const deleteProject = (projectId: number): Promise<void> =>
  api.delete(`${BASE}/projects/${projectId}`);

// ── Certifications ─────────────────────────────────────────────────────────────
export const getCertifications = (studentId: number): Promise<Certification[]> =>
  api.get(`${BASE}/certifications/${studentId}`);

export const createCertification = (data: CertificationCreateRequest): Promise<Certification> =>
  api.post(`${BASE}/certifications`, data);

export const updateCertification = (certId: number, data: CertificationUpdateRequest): Promise<Certification> =>
  api.patch(`${BASE}/certifications/${certId}`, data);

export const deleteCertification = (certId: number): Promise<void> =>
  api.delete(`${BASE}/certifications/${certId}`);

// ── Skills ─────────────────────────────────────────────────────────────────────
export const getSkills = (studentId: number): Promise<Skill[]> =>
  api.get(`${BASE}/skills/${studentId}`);

export const createSkill = (data: SkillCreateRequest): Promise<Skill> =>
  api.post(`${BASE}/skills`, data);

export const updateSkill = (skillId: number, data: Partial<SkillCreateRequest>): Promise<Skill> =>
  api.patch(`${BASE}/skills/${skillId}`, data);

export const deleteSkill = (skillId: number): Promise<void> =>
  api.delete(`${BASE}/skills/${skillId}`);

// ── AI Insights ────────────────────────────────────────────────────────────────
export const getAIInsights = (studentId: number): Promise<AIInsights> =>
  api.get(`${BASE}/ai-insights/${studentId}`);

export const triggerAIAnalysis = (studentId: number): Promise<{ message: string }> =>
  api.post(`${BASE}/ai-insights/trigger/${studentId}`);

// ── GitHub Analysis ────────────────────────────────────────────────────────────
export const getGitHubAnalysis = (studentId: number, forceRefresh = false): Promise<GitHubAnalysis> =>
  api.get(`${BASE}/github-analysis/${studentId}?force_refresh=${forceRefresh}`);

export const importGitHubProjects = (): Promise<{ message: string; imported: number }> =>
  api.post(`${BASE}/github-analysis/import-projects`);

export const githubCallback = (code: string): Promise<{ message: string; detail: string }> =>
  api.post(`${BASE}/github-analysis/callback`, { code });

// ── LeetCode Analysis ──────────────────────────────────────────────────────────
export const getLeetCodeAnalysis = (studentId: number, forceRefresh = false): Promise<any> =>
  api.get(`${BASE}/leetcode-analysis/${studentId}?force_refresh=${forceRefresh}`);

export const connectLeetCode = (username: string): Promise<{ message: string }> =>
  api.post(`${BASE}/leetcode-analysis/connect`, { username });

// ── LinkedIn Connect ───────────────────────────────────────────────────────────
export const connectLinkedIn = (): Promise<{ message: string; detail: string }> =>
  api.post(`${BASE}/profile/connect-linkedin`);

export const linkedinCallback = (code: string): Promise<{ message: string; detail: string }> =>
  api.post(`${BASE}/profile/connect-linkedin`, { code });

// ── Career Readiness ───────────────────────────────────────────────────────────
export const getCareerReadiness = (studentId: number): Promise<CareerReadiness> =>
  api.get(`${BASE}/career-readiness/${studentId}`);

// ── Resume Upload ──────────────────────────────────────────────────────────────
export const uploadResume = (file: File): Promise<Record<string, unknown>> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`${BASE}/resume/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Faculty Verification ───────────────────────────────────────────────────────
export const getPendingVerifications = (): Promise<{ items: PendingVerificationItem[]; total: number }> =>
  api.get(`${BASE}/faculty/pending-verifications`);

export const verifyProject = (
  projectId: number,
  data: { verification_status: string; faculty_remarks?: string },
): Promise<{ message: string }> =>
  api.patch(`${BASE}/faculty/verify/project/${projectId}`, data);

export const verifySkill = (
  skillId: number,
  data: { faculty_rating: number; verification_status?: string },
): Promise<{ message: string }> =>
  api.patch(`${BASE}/faculty/verify/skill/${skillId}`, data);
