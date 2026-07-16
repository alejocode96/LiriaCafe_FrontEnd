import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/auth.store';

/**
 * Llama a GET /auth/me al montar MainLayout.
 * Sobreescribe el usuario en el store con los datos completos
 * (incluyendo rol.permisos detallados que el login no devuelve).
 */
export function useCurrentUser() {
  const { setUsuario, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      // Backend responde { success, data: { id, nombreCompleto, rol: { permisos } } }
      return res.data?.data ?? res.data;
    },
    enabled: isAuthenticated,   // solo corre si hay sesión activa
    staleTime: 5 * 60 * 1000,  // considera fresco por 5 min
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setUsuario(query.data);
    }
  }, [query.data, setUsuario]);

  return query;
}