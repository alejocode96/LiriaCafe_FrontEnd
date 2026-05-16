import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const useCashStatus = () => {
  return useQuery({
    queryKey: ['cash-status'],
    queryFn: async () => {
      const res = await api.get('/cash/current');
      return res.data;
    },
    // Consulta cada 5 minutos — no necesita ser tiempo real
    refetchInterval: 5 * 60 * 1000,
    // Si falla no rompe la app
    retry: 1,
  });
};