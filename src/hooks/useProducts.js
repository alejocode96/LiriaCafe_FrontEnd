import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProductsRequest, getProductByIdRequest,
  createProductRequest, updateProductRequest,
  deactivateProductRequest, activateProductRequest,
  createVariantRequest, updateVariantRequest,
  deactivateVariantRequest, activateVariantRequest,
} from '../api/products.service';

const QK = 'products';

export function useProducts(params) {
  return useQuery({
    queryKey: [QK, 'list', params],
    queryFn: async () => { const res = await getProductsRequest(params); return res.data ?? {}; },
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

export function useProductById(id) {
  return useQuery({
    queryKey: [QK, 'detail', id],
    queryFn: async () => { const res = await getProductByIdRequest(id); return res.data?.data ?? res.data; },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createProductRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateProductRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateProductRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useActivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateProductRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...data }) => createVariantRequest(productId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, ...data }) => updateVariantRequest(productId, variantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeactivateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }) => deactivateVariantRequest(productId, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useActivateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }) => activateVariantRequest(productId, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
