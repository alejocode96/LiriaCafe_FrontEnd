import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSaleRequest, getSalesRequest,
  getSaleByIdRequest, cancelSaleRequest,
} from '../api/sales.service';

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSaleRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-register'] }),
  });
}

export function useSales(params) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => getSalesRequest(params).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSaleById(id) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => getSaleByIdRequest(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) =>
      cancelSaleRequest(id, { motivoAnulacion: motivo }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  });
}
