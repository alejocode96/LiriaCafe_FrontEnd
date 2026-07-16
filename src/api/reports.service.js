import client from './client';

export const getDashboardRequest           = (params) => client.get('/reports/dashboard', { params });
export const getInventoryAlertsRequest     = ()       => client.get('/reports/inventory', { params: { soloAlertas: true } });
export const getSalesReportRequest         = (params) => client.get('/reports/sales', { params });
export const getProfitabilityReportRequest = (params) => client.get('/reports/profitability', { params });
export const getInventoryReportRequest     = (params) => client.get('/reports/inventory', { params });
export const getCashReportRequest          = (params) => client.get('/reports/cash', { params });
export const getKardexRequest              = (itemId, params) => client.get(`/inventory/items/${itemId}/kardex`, { params });
