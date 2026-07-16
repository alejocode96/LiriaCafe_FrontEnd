import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  openCashRegisterRequest,
  getCashRegisterCurrentRequest,
  getCashRegisterStatusRequest,
  closeCashRegisterRequest,
  getCashRegisterHistoryRequest,
  getCashRegisterByIdRequest,
} from '../api/cashRegister.service';

const QK = 'cash-register';

// Estado global de caja (polling 1 minuto — para el banner del Sidebar)
export function useCashStatus() {
  return useQuery({
    queryKey: [QK, 'status'],
    queryFn: async () => {
      const res = await getCashRegisterStatusRequest();
      return res.data?.data ?? { hayTCajaAbierta: false };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}

// Caja actual con resumen de ventas (polling 30s — para CajaPage)
export function useCashCurrent() {
  return useQuery({
    queryKey: [QK, 'current'],
    queryFn: async () => {
      try {
        const res = await getCashRegisterCurrentRequest();
        return res.data?.data ?? null;
      } catch (err) {
        if (err?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  });
}

// Historial de cajas
export function useCashHistory(params) {
  return useQuery({
    queryKey: [QK, 'history', params],
    queryFn: async () => {
      const res = await getCashRegisterHistoryRequest(params);
      return res.data ?? {};
    },
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

// Detalle de una caja específica (para panel de historial)
export function useCashRegisterById(id) {
  return useQuery({
    queryKey: [QK, 'detail', id],
    queryFn: async () => {
      const res = await getCashRegisterByIdRequest(id);
      return res.data?.data ?? null;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// Abrir caja
export function useOpenCashRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => openCashRegisterRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

// Cerrar caja
export function useCloseCashRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => closeCashRegisterRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
