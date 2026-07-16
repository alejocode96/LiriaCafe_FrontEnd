import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsersRequest,
  createUserRequest,
  updateUserRequest,
  deactivateUserRequest,
  reactivateUserRequest,
  unlockUserRequest,
  forcePasswordChangeRequest,
  getRolesRequest,
} from '../api/users.service';

const UK = 'users';
const RK = 'roles';

export function useUsers(params = {}) {
  return useQuery({
    queryKey: [UK, params],
    queryFn: () => getUsersRequest(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: [RK, 'active'],
    queryFn: async () => {
      // Intenta primero con filtro, si falla devuelve todos
      try {
        const r = await getRolesRequest({ estado: 'ACTIVO' });
        return r.data;
      } catch {
        const r = await getRolesRequest();
        return r.data;
      }
    },
    staleTime: 120_000,
    retry: 1,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createUserRequest(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateUserRequest(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateUserRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => reactivateUserRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => unlockUserRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}

export function useForcePasswordChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => forcePasswordChangeRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UK] }),
  });
}
