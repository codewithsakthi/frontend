// SPICS — Custom React hooks using TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type { ProfileCreateRequest, ProjectCreateRequest, SkillCreateRequest, CertificationCreateRequest, CertificationUpdateRequest } from '../types';

// Query keys
export const KEYS = {
  profile:     (id: number) => ['spics', 'profile', id] as const,
  projects:    (id: number) => ['spics', 'projects', id] as const,
  certs:       (id: number) => ['spics', 'certs', id] as const,
  skills:      (id: number) => ['spics', 'skills', id] as const,
  insights:    (id: number) => ['spics', 'insights', id] as const,
  github:      (id: number) => ['spics', 'github', id] as const,
  readiness:   (id: number) => ['spics', 'readiness', id] as const,
  pending:     ()           => ['spics', 'pending'] as const,
};

// ── Profile Hooks ──────────────────────────────────────────────────────────────
export const useProfile = (studentId: number) =>
  useQuery({
    queryKey: KEYS.profile(studentId),
    queryFn:  () => api.getProfile(studentId),
    retry: false,
  });

export const useUpsertProfile = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileCreateRequest) => api.upsertProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
    },
  });
};

// ── Project Hooks ──────────────────────────────────────────────────────────────
export const useProjects = (studentId: number) =>
  useQuery({
    queryKey: KEYS.projects(studentId),
    queryFn:  () => api.getProjects(studentId),
  });

export const useCreateProject = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreateRequest) => api.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.projects(studentId) }),
  });
};

export const useDeleteProject = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.deleteProject(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.projects(studentId) }),
  });
};

// ── Skill Hooks ────────────────────────────────────────────────────────────────
export const useSkills = (studentId: number) =>
  useQuery({
    queryKey: KEYS.skills(studentId),
    queryFn:  () => api.getSkills(studentId),
  });

export const useCreateSkill = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SkillCreateRequest) => api.createSkill(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.skills(studentId) }),
  });
};

export const useDeleteSkill = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: number) => api.deleteSkill(skillId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.skills(studentId) }),
  });
};

// ── Certification Hooks ────────────────────────────────────────────────────────
export const useCertifications = (studentId: number) =>
  useQuery({
    queryKey: KEYS.certs(studentId),
    queryFn:  () => api.getCertifications(studentId),
  });

export const useCreateCertification = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificationCreateRequest) => api.createCertification(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.certs(studentId) }),
  });
};

export const useUpdateCertification = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ certId, data }: { certId: number; data: CertificationUpdateRequest }) =>
      api.updateCertification(certId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.certs(studentId) }),
  });
};

export const useDeleteCertification = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: number) => api.deleteCertification(certId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.certs(studentId) }),
  });
};

// ── AI Insights Hooks ──────────────────────────────────────────────────────────
export const useAIInsights = (studentId: number) =>
  useQuery({
    queryKey: KEYS.insights(studentId),
    queryFn:  () => api.getAIInsights(studentId),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.ai_status;
      return status === 'pending' || status === 'processing' ? 8000 : false;
    },
  });

export const useTriggerAI = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.triggerAIAnalysis(studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.insights(studentId) }),
  });
};

// ── GitHub Hooks ───────────────────────────────────────────────────────────────
export const useGitHubAnalysis = (studentId: number) =>
  useQuery({
    queryKey: KEYS.github(studentId),
    queryFn:  () => api.getGitHubAnalysis(studentId),
    retry: false,
    staleTime: 60 * 60 * 1000, // 1 hour (matches server cache)
  });

export const useImportGitHubProjects = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.importGitHubProjects(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.projects(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
    },
  });
};

export const useGitHubCallback = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.githubCallback(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.projects(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.github(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
    },
  });
};

// ── LeetCode Hooks ─────────────────────────────────────────────────────────────
export const useLeetCodeAnalysis = (studentId: number) =>
  useQuery({
    queryKey: ['spics', 'leetcode', studentId],
    queryFn:  () => api.getLeetCodeAnalysis(studentId),
    retry: false,
    staleTime: 60 * 60 * 1000,
  });

export const useConnectLeetCode = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => api.connectLeetCode(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spics', 'leetcode', studentId] });
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
    },
  });
};

// ── LinkedIn Connect Hook ──────────────────────────────────────────────────────
export const useConnectLinkedIn = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.connectLinkedIn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.skills(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.certs(studentId) });
    },
  });
};

// ── Resume Upload Hook ─────────────────────────────────────────────────────────
export const useUploadResume = (studentId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadResume(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.profile(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.readiness(studentId) });
      qc.invalidateQueries({ queryKey: KEYS.insights(studentId) });
    },
  });
};

// ── Career Readiness Hook ──────────────────────────────────────────────────────
export const useCareerReadiness = (studentId: number) =>
  useQuery({
    queryKey: KEYS.readiness(studentId),
    queryFn:  () => api.getCareerReadiness(studentId),
  });

// ── Faculty Hooks ──────────────────────────────────────────────────────────────
export const usePendingVerifications = () =>
  useQuery({
    queryKey: KEYS.pending(),
    queryFn:  () => api.getPendingVerifications(),
  });

export const useVerifyProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { verification_status: string; faculty_remarks?: string } }) =>
      api.verifyProject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pending() }),
  });
};

export const useVerifySkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { faculty_rating: number } }) =>
      api.verifySkill(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pending() }),
  });
};
