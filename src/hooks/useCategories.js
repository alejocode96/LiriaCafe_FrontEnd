import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategoriesRequest,
  createCategoryRequest,
  updateCategoryRequest,
  deactivateCategoryRequest,
  activateCategoryRequest,
} from '../api/categories.service';

const QK = 'categories';

export function useCategories(params) {
  return useQuery({
    queryKey: [QK, params],
    queryFn: async () => {
      const res = await getCategoriesRequest(params);
      // Devuelve { data: [...], meta: {...} }
      return res.data ?? {};
    },
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createCategoryRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateCategoryRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeactivateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateCategoryRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useActivateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateCategoryRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
