import client from './client';

export const getInventoryItemsRequest    = (params)      => client.get('/inventory/items', { params });
export const getInventoryItemByIdRequest = (id)          => client.get(`/inventory/items/${id}`);
export const createInventoryItemRequest  = (data)        => client.post('/inventory/items', data);
export const updateInventoryItemRequest  = (id, data)    => client.put(`/inventory/items/${id}`, data);
export const registerEntryRequest        = (id, data)    => client.post(`/inventory/items/${id}/entries`, data);
export const getKardexRequest            = (id, params)  => client.get(`/inventory/items/${id}/kardex`, { params });
export const deactivateItemRequest       = (id)          => client.patch(`/inventory/items/${id}/deactivate`);
export const activateItemRequest         = (id)          => client.patch(`/inventory/items/${id}/activate`);
