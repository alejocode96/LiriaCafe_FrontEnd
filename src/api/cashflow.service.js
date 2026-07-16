import client from './client';

export const createMovementRequest     = (data)   => client.post('/cash-flow/movements', data);
export const getMovementsRequest       = (params) => client.get('/cash-flow/movements', { params });
export const getMovementByIdRequest    = (id)     => client.get(`/cash-flow/movements/${id}`);
export const getCashFlowSummaryRequest = (params) => client.get('/cash-flow/summary', { params });

export const getCFCategoriesRequest  = (params) => client.get('/cash-flow/categories', { params });
export const createCFCategoryRequest = (data)   => client.post('/cash-flow/categories', data);
export const deactivateCFCatRequest  = (id)     => client.patch(`/cash-flow/categories/${id}/deactivate`);
export const activateCFCatRequest    = (id)      => client.patch(`/cash-flow/categories/${id}/activate`);
