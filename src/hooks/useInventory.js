import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInventoryItemsRequest,
  getInventoryItemByIdRequest,
  createInventoryItemRequest,
  updateInventoryItemRequest,
  registerEntryRequest,
  getKardexRequest,
  deactivateItemRequest,
  activateItemRequest,
} from '../api/inventory.service';

const QK = 'inventory';

export function useInventoryItems(params) {
  return useQuery({
    queryKey: [QK, 'list', params],
    queryFn: async () => {
      const res = await getInventoryItemsRequest(params);
      return res.data ?? {};
    },
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

export function useInventoryItemById(id) {
  return useQuery({
    queryKey: [QK, 'detail', id],
    queryFn: async () => {
      const res = await getInventoryItemByIdRequest(id);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useKardex(id, params) {
  return useQuery({
    queryKey: [QK, 'kardex', id, params],
    queryFn: async () => {
      const res = await getKardexRequest(id, params);
      return res.data ?? {};
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createInventoryItemRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateInventoryItemRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useRegisterEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => registerEntryRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeactivateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateItemRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useActivateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateItemRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
