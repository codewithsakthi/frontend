import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { StaffProfile } from '../../../types/enterprise';

/**
 * Hook for assigning sections to  batch
 */
export function useAssignSectionsMutation(onSuccess?: (data: any) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batch: string) => {
      const response = await api.post(`admin/assign-sections?batch=${encodeURIComponent(batch)}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-command-center'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      onSuccess?.(data);
    },
  });
}

/**
 * Hook for creating new staff member
 */
export function useCreateStaffMutation(
  onSuccess?: (newId: number | string, data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('admin/staff', payload);
      return { response, payload };
    },
    onSuccess: async ({ response, payload }) => {
      const newId = response?.id || response?.data?.id || response?.staff_id;
      try {
        if (newId !== undefined) {
          const subjectPayload = {
            subject_codes: payload.subject_codes || [],
            subject_ids: payload.subject_ids || [],
          };
          if (subjectPayload.subject_codes?.length || subjectPayload.subject_ids?.length) {
            await api.post(`admin/staff/${newId}/subjects`, subjectPayload);
          }
        }
      } catch (e) {
        console.error('Failed assigning subjects to new staff', e);
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-directory'] });
      onSuccess?.(newId, response);
    },
    onError,
  });
}

/**
 * Hook for updating staff member
 */
export function useUpdateStaffMutation(
  onSuccess?: (data: any, variables: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const response = await api.patch(`admin/staff/${id}`, payload);
      return { response, id, payload };
    },
    onSuccess: async ({ response, id, payload }) => {
      try {
        const subjectPayload = {
          subject_codes: payload.subject_codes || [],
          subject_ids: payload.subject_ids || [],
        };
        if (subjectPayload.subject_codes?.length || subjectPayload.subject_ids?.length) {
          await api.post(`admin/staff/${id}/subjects`, subjectPayload);
        }
      } catch (e) {
        console.error('Failed updating staff subjects', e);
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-directory'] });
      onSuccess?.(response, { id, ...payload });
    },
    onError,
  });
}

/**
 * Hook for deleting staff member
 */
export function useDeleteStaffMutation(
  onSuccess?: (data: any, id: number) => void,
  onError?: (error: any, id: number) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`admin/staff/${id}`);
      return { response, id };
    },
    onSuccess: ({ response, id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-directory'] });
      onSuccess?.(response, id);
    },
    onError: (error, id) => {
      const status = (error as any)?.response?.status;
      if (status === 405) {
        alert('Delete is not allowed by the server (405). Please remove this user manually in the backend.');
      }
      onError?.(error, id);
    },
  });
}
