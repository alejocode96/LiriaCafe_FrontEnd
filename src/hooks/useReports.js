import { useQuery } from '@tanstack/react-query';
import {
  getDashboardRequest, getInventoryAlertsRequest,
  getSalesReportRequest, getProfitabilityReportRequest,
  getInventoryReportRequest, getCashReportRequest, getKardexRequest,
} from '../api/reports.service';

export function useDashboard(params) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => getDashboardRequest(params).then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => getInventoryAlertsRequest().then((r) => r.data),
    staleTime: 120_000,
  });
}

export function useSalesReport(params) {
  return useQuery({
    queryKey: ['sales-report', params],
    queryFn: () => getSalesReportRequest(params).then((r) => r.data),
    enabled: false,
    staleTime: 0,
    retry: false,
  });
}

export function useProfitabilityReport(params) {
  return useQuery({
    queryKey: ['profitability-report', params],
    queryFn: () => getProfitabilityReportRequest(params).then((r) => r.data),
    enabled: false,
    staleTime: 0,
    retry: false,
  });
}

export function useInventoryReport(params) {
  return useQuery({
    queryKey: ['inventory-report', params],
    queryFn: () => getInventoryReportRequest(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCashReport(params) {
  return useQuery({
    queryKey: ['cash-report', params],
    queryFn: () => getCashReportRequest(params).then((r) => r.data),
    enabled: false,
    staleTime: 0,
    retry: false,
  });
}

export function useKardex(itemId, params) {
  return useQuery({
    queryKey: ['kardex', itemId, params],
    queryFn: () => getKardexRequest(itemId, params).then((r) => r.data),
    enabled: !!itemId,
    staleTime: 30_000,
  });
}
