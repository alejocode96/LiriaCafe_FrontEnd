import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMovementRequest, getMovementsRequest, getMovementByIdRequest,
  getCashFlowSummaryRequest, getCFCategoriesRequest, createCFCategoryRequest,
  deactivateCFCatRequest, activateCFCatRequest,
} from '../api/cashflow.service';

const QK = 'cash-flow';

export function useMovements(params) {
  return useQuery({
    queryKey: [QK, 'movements', params],
    queryFn: () => getMovementsRequest(params).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useMovementById(id) {
  return useQuery({
    queryKey: [QK, 'movement', id],
    queryFn: () => getMovementByIdRequest(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCashFlowSummary(params) {
  return useQuery({
    queryKey: [QK, 'summary', params],
    queryFn: () => getCashFlowSummaryRequest(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createMovementRequest(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: ['cash-register'] });
    },
  });
}

export function useCFCategories(params) {
  return useQuery({
    queryKey: [QK, 'categories', params],
    queryFn: () => getCFCategoriesRequest(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCreateCFCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createCFCategoryRequest(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK, 'categories'] }),
  });
}

export function useDeactivateCFCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateCFCatRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK, 'categories'] }),
  });
}

export function useActivateCFCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateCFCatRequest(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK, 'categories'] }),
  });
}
