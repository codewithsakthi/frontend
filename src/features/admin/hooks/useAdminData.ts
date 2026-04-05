import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { AdminCommandCenterResponse } from '../../../types/enterprise';

export function useAdminCommandCenter() {
  const { data, isLoading, error } = useQuery<AdminCommandCenterResponse>({
    queryKey: ['admin-command-center'],
    queryFn: () => api.get('admin/command-center') as Promise<AdminCommandCenterResponse>,
  });

  return {
    commandCenter: data,
    isLoading,
    error,
  };
}

export function useStudentSpotlight(searchTerm: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-search', searchTerm],
    queryFn: () => api.get(`admin/students?search=${searchTerm}`) as Promise<any>,
    enabled: searchTerm.length > 2,
  });

  return {
    results: data,
    isLoading,
    error,
  };
}

export function useSubjectCatalog(batch?: string, section?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-subject-catalog', batch, section],
    queryFn: () => {
      const params = new URLSearchParams();
      if (batch && batch !== "ALL") {
        params.set("batch", batch);
      }
      if (section && section !== "ALL") {
        params.set("section", section);
      }
      const queryString = params.toString();
      return api.get(`admin/subject-catalog${queryString ? `?${queryString}` : ""}`) as Promise<any>;
    },
  });

  return { subjects: data, isLoading, error };
}

export function useSubjectLeaderboard(subjectCode: string, section?: string, semester?: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-subject-leaderboard', subjectCode, section || 'ALL', semester || 'ALL'],
    queryFn: () => {
      const params = new URLSearchParams();
      if (section && section !== 'ALL') params.append('section', section);
      if (semester) params.append('semester', semester.toString());
      const queryStr = params.toString();
      return api.get(`admin/subject-leaderboard/${subjectCode}${queryStr ? `?${queryStr}` : ''}`) as Promise<any>;
    },
    enabled: !!subjectCode,
  });

  return { leaderboard: data, isLoading, error };
}

export function useOverallLeaderboard(section?: string, batch?: string, semester?: number) {
  const queryParams = new URLSearchParams();
  if (section && section !== 'ALL') queryParams.append('section', section);
  if (batch && batch !== 'ALL') queryParams.append('batch', batch);
  if (semester) queryParams.append('semester', semester.toString());
  
  const queryStr = queryParams.toString();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overall-leaderboard', section || 'ALL', batch || 'ALL', semester || 'ALL'],
    queryFn: () => api.get(`admin/leaderboard/overall${queryStr ? `?${queryStr}` : ''}`) as Promise<any>,
  });

  return { leaderboard: data, isLoading, error };
}

export function useBatches() {
  const { data, isLoading, error } = useQuery<string[]>({
    queryKey: ['admin-batches'],
    queryFn: () => api.get('admin/batches') as Promise<string[]>,
  });

  return { batches: data || [], isLoading, error };
}
