// ============================================================================
// Archivo: src/hooks/useIngredients.js
// Descripción:
// Hooks personalizados para la gestión de ingredientes e inventario.
//
// Este módulo centraliza toda la lógica de:
// - Consulta de ingredientes
// - Paginación y filtros
// - Movimientos de inventario
// - Creación y actualización
// - Eliminación lógica
// - Sincronización automática de caché
//
// Tecnologías:
// - React Query (TanStack Query)
// - Axios Client personalizado
// - React Hot Toast
//
// Proyecto:
// LIRIACAFE POS
//
// Porque tener lógica HTTP repetida en 14 componentes distintos es una forma
// particularmente creativa de destruir la salud mental del equipo.
//
// ============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import api from '../api/client';
import toast from 'react-hot-toast';

// ============================================================================
// HOOK: useIngredients
// ----------------------------------------------------------------------------
// Obtiene listado paginado de ingredientes.
//
// Características:
// - Búsqueda por nombre
// - Filtro de bajo stock
// - Paginación
// - Caché automática
// - Refetch cada 60 segundos
//
// @param {Object} params
// @param {string} params.search       Texto de búsqueda
// @param {boolean} params.low_stock   Filtrar ingredientes con bajo stock
// @param {number} params.page         Página actual
// @param {number} params.limit        Cantidad por página
//
// @returns {Object}
// ============================================================================

export const useIngredients = (params = {}) =>
  useQuery({
    /**
     * Query Key
     * ------------------------------------------------------------
     * React Query utilizará esta key para cachear resultados únicos
     * dependiendo de los filtros aplicados.
     *
     * Ejemplo:
     * ['ingredients', { search: 'cafe', page: 1 }]
     */
    queryKey: ['ingredients', params],

    /**
     * Función principal de consulta.
     */
   queryFn: async () => {
        const query = new URLSearchParams();

        if (params.search) {
            query.set('search', params.search);
        }

        if (params.low_stock) {
            query.set('low_stock', 'true');
        }

        if (params.page) {
            query.set('page', params.page);
        }

        // Filtro de estado: 'active' | 'inactive' | undefined (todos)
        if (params.status && params.status !== 'all') {
            query.set('status', params.status);
        }

        query.set('limit', params.limit || 20);

        const res = await api.get(`/ingredients?${query.toString()}`);
        return res;
    },

    /**
     * Refetch automático cada 60 segundos.
     *
     * Útil en entornos POS multiusuario donde el inventario
     * puede cambiar constantemente.
     */
    refetchInterval: 60000,

    /**
     * Mantiene datos previos mientras cambia la paginación.
     *
     * Evita flickering visual.
     * La UI deja de parecer una lámpara defectuosa.
     */
    keepPreviousData: true,
  });

// ============================================================================
// HOOK: useIngredientMovements
// ----------------------------------------------------------------------------
// Obtiene historial de movimientos de un ingrediente.
//
// @param {number|string} id
// @param {boolean} enabled
//
// @returns {Object}
// ============================================================================

export const useIngredientMovements = (
  id,
  enabled = false
) =>
  useQuery({
    /**
     * Cache independiente por ingrediente.
     */
    queryKey: ['ingredient-movements', id],

    /**
     * Consulta historial de movimientos.
     */
    queryFn: async () => {
      const res = await api.get(
        `/ingredients/${id}/movements`
      );

      return res;
    },

    /**
     * Ejecuta query únicamente si:
     * - Existe ID
     * - enabled === true
     *
     * Ideal para modales o pantallas lazy-loaded.
     */
    enabled: !!id && enabled,
  });

// ============================================================================
// HOOK: useCreateIngredient
// ----------------------------------------------------------------------------
// Crea un nuevo ingrediente.
//
// Funcionalidades:
// - Registro en backend
// - Invalidación automática de caché
// - Actualización de alertas de stock
// - Notificaciones visuales
//
// @returns {Object}
// ============================================================================

export const useCreateIngredient = () => {
  /**
   * Cliente global de React Query.
   */
  const qc = useQueryClient();

  return useMutation({
    /**
     * Mutación principal.
     */
    mutationFn: (body) =>
      api.post('/ingredients', body),

    /**
     * Evento ejecutado tras creación exitosa.
     */
    onSuccess: () => {
      /**
       * Refresca listado principal.
       */
      qc.invalidateQueries({
        queryKey: ['ingredients'],
      });

      /**
       * Refresca contador de bajo stock.
       */
      qc.invalidateQueries({
        queryKey: ['low-stock-count'],
      });

      /**
       * Notificación de éxito.
       */
      toast.success('Ingrediente creado');
    },

    /**
     * Manejo global de errores.
     */
    onError: (err) => {
      toast.error(
        err?.message || 'Error al crear'
      );
    },
  });
};

// ============================================================================
// HOOK: useUpdateIngredient
// ----------------------------------------------------------------------------
// Actualiza información de un ingrediente.
//
// @returns {Object}
// ============================================================================

export const useUpdateIngredient = () => {
  const qc = useQueryClient();

  return useMutation({
    /**
     * Extrae el ID y envía el resto como payload.
     */
    mutationFn: ({ id, ...body }) =>
      api.put(`/ingredients/${id}`, body),

    /**
     * Refresca datos tras actualización.
     */
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['ingredients'],
      });

      toast.success('Ingrediente actualizado');
    },

    /**
     * Manejo de errores.
     */
    onError: (err) => {
      toast.error(
        err?.message || 'Error al actualizar'
      );
    },
  });
};

// ============================================================================
// HOOK: useDeleteIngredient
// ----------------------------------------------------------------------------
// Realiza eliminación lógica (soft delete).
//
// NOTA:
// No elimina físicamente el registro.
//
// Esto preserva:
// - Historial
// - Trazabilidad
// - Integridad relacional
//
// Porque borrar datos reales en producción suele convertirse en una reunión
// larguísima con caras de sufrimiento y café frío.
//
// @returns {Object}
// ============================================================================

export const useDeleteIngredient = () => {
  const qc = useQueryClient();

  return useMutation({
    /**
     * Eliminación lógica.
     */
    mutationFn: (id) =>
      api.delete(`/ingredients/${id}`),

    /**
     * Actualiza caché relacionada.
     */
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['ingredients'],
      });

      qc.invalidateQueries({
        queryKey: ['low-stock-count'],
      });

      toast.success('Ingrediente desactivado');
    },

    /**
     * Error común:
     * Ingrediente relacionado con recetas o ventas.
     */
    onError: (err) => {
      toast.error(
        err?.message ||
          'No se puede eliminar: ingrediente en uso'
      );
    },
  });
};

// ============================================================================
// HOOK: useStockMovement
// ----------------------------------------------------------------------------
// Registra movimientos de inventario.
//
// Tipos comunes:
// - Entrada
// - Salida
// - Ajuste
// - Merma
//
// @param {number|string} id
//
// @returns {Object}
// ============================================================================

export const useStockMovement = (id) => {
  const qc = useQueryClient();

  return useMutation({
    /**
     * Registro de movimiento.
     */
    mutationFn: (body) =>
      api.post(
        `/ingredients/${id}/movements`,
        body
      ),

    /**
     * Actualización automática de caché.
     */
    onSuccess: () => {
      /**
       * Refresca listado general.
       */
      qc.invalidateQueries({
        queryKey: ['ingredients'],
      });

      /**
       * Refresca historial del ingrediente.
       */
      qc.invalidateQueries({
        queryKey: ['ingredient-movements', id],
      });

      /**
       * Refresca alertas de stock.
       */
      qc.invalidateQueries({
        queryKey: ['low-stock-count'],
      });

      toast.success('Movimiento registrado');
    },

    /**
     * Manejo de errores.
     */
    onError: (err) => {
      toast.error(
        err?.message ||
          'Error al registrar movimiento'
      );
    },
  });
};