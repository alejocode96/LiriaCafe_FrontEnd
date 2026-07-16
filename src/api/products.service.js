import client from './client';

export const getProductsRequest       = (params)                   => client.get('/products', { params });
export const getProductByIdRequest    = (id)                       => client.get(`/products/${id}`);
export const createProductRequest     = (data)                     => client.post('/products', data);
export const updateProductRequest     = (id, data)                 => client.put(`/products/${id}`, data);
export const deactivateProductRequest = (id)                       => client.patch(`/products/${id}/deactivate`);
export const activateProductRequest   = (id)                       => client.patch(`/products/${id}/activate`);

export const createVariantRequest     = (productId, data)              => client.post(`/products/${productId}/variants`, data);
export const updateVariantRequest     = (productId, variantId, data)   => client.put(`/products/${productId}/variants/${variantId}`, data);
export const deactivateVariantRequest = (productId, variantId)         => client.patch(`/products/${productId}/variants/${variantId}/deactivate`);
export const activateVariantRequest   = (productId, variantId)         => client.patch(`/products/${productId}/variants/${variantId}/activate`);
