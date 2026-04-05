import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { 
  AdminCommandCenterResponse, 
  RiskRegistryResponse, 
  StaffProfile,
  AdminDirectoryPage,
  SubjectLeaderboardResponse 
} from '../../../types/enterprise';

export function useAdminCommandCenter(refetchInterval?: number) {
  return useQuery<AdminCommandCenterResponse>({
    queryKey: ['admin-command-center'],
    queryFn: () => api.get('admin/command-center') as Promise<AdminCommandCenterResponse>,
    staleTime: 30_000,
    refetchInterval: refetchInterval || false,
  });
}

export function useRiskRegistry(riskLevel: string, limit: number = 20) {
  return useQuery<RiskRegistryResponse>({
    queryKey: ['admin-risk-registry', riskLevel],
    queryFn: () =>
      api.get(
        `admin/risk-registry?level=${encodeURIComponent(riskLevel)}&limit=${limit}`
      ) as Promise<RiskRegistryResponse>,
    enabled: !!riskLevel,
    staleTime: 30_000,
  });
}

export function useStaffDirectory(searchTerm: string = '', limit: number = 50) {
  return useQuery<StaffProfile[]>({
    queryKey: ['admin-staff-directory', searchTerm],
    queryFn: () =>
      api.get(`admin/staff?search=${encodeURIComponent(searchTerm)}&limit=${limit}`) as Promise<StaffProfile[]>,
    staleTime: 30_000,
  });
}

export function useStudentDirectory(
  searchTerm: string = '',
  offset: number = 0,
  batch: string = 'ALL',
  semester: string = 'ALL',
  section: string = 'ALL',
  riskOnly: boolean = false,
  sortBy: string = 'rank',
  sortDir: string = 'asc',
  limit: number = 50
) {
  return useQuery<AdminDirectoryPage>({
    queryKey: [
      'admin-student-directory',
      searchTerm,
      offset,
      batch,
      semester,
      section,
      riskOnly,
      sortBy,
      sortDir,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('offset', String(offset));
      if (batch !== 'ALL') params.append('batch', batch);
      if (semester !== 'ALL') params.append('semester', semester);
      if (section !== 'ALL') params.append('section', section);
      if (riskOnly) params.append('risk_only', 'true');
      params.append('sort_by', sortBy);
      params.append('sort_dir', sortDir);
      params.append('limit', String(limit));
      return api.get(`admin/students?${params}`) as Promise<AdminDirectoryPage>;
    },
    staleTime: 30_000,
  });
}

export function useSubjectLeaderboard(subjectCode: string = '', semester: string = 'ALL', limit: number = 20) {
  return useQuery<SubjectLeaderboardResponse>({
    queryKey: ['admin-subject-leaderboard', subjectCode, semester],
    queryFn: () => {
      const params = new URLSearchParams();
      if (subjectCode) params.append('subject_code', subjectCode);
      if (semester !== 'ALL') params.append('semester', semester);
      params.append('limit', String(limit));
      return api.get(`admin/leaderboard?${params}`) as Promise<SubjectLeaderboardResponse>;
    },
    enabled: !!subjectCode,
    staleTime: 30_000,
  });
}
