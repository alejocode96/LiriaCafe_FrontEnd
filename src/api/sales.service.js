import client from './client';

export const createSaleRequest  = (data)        => client.post('/sales', data);
export const getSalesRequest    = (params)       => client.get('/sales', { params });
export const getSaleByIdRequest = (id)           => client.get(`/sales/${id}`);
export const cancelSaleRequest  = (id, body)     => client.post(`/sales/${id}/cancel`, body);
