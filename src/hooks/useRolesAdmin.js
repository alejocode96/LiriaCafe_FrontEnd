import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRolesAdminRequest,
  getRoleByIdRequest,
  createRoleRequest,
  updateRoleRequest,
  deactivateRoleRequest,
  reactivateRoleRequest,
  getRoleUsersRequest,
} from '../api/roles.service';

const RK = 'roles-admin';

export function useRolesAdmin(params = {}) {
  return useQuery({
    queryKey: [RK, params],
    queryFn: () => getRolesAdminRequest(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useRoleById(id) {
  return useQuery({
    queryKey: [RK, 'detail', id],
    queryFn: () => getRoleByIdRequest(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useRoleUsers(id) {
  return useQuery({
    queryKey: [RK, 'users', id],
    queryFn: () => getRoleUsersRequest(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createRoleRequest(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RK] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateRoleRequest(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RK] }),
  });
}

export function useDeactivateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateRoleRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RK] }),
  });
}

export function useReactivateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => reactivateRoleRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RK] }),
  });
}
