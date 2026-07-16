import client from './client';

export const getCategoriesRequest      = (params)     => client.get('/categories', { params });
export const createCategoryRequest     = (data)        => client.post('/categories', data);
export const updateCategoryRequest     = (id, data)    => client.put(`/categories/${id}`, data);
export const deactivateCategoryRequest = (id)          => client.patch(`/categories/${id}/deactivate`);
export const activateCategoryRequest   = (id)          => client.patch(`/categories/${id}/activate`);
