import client from './client';

export const getRolesAdminRequest    = (params) => client.get('/roles', { params });
export const getRoleByIdRequest      = (id)     => client.get(`/roles/${id}`);
export const createRoleRequest       = (data)   => client.post('/roles', data);
export const updateRoleRequest       = (id, data) => client.put(`/roles/${id}`, data);
export const deactivateRoleRequest   = (id)     => client.patch(`/roles/${id}/deactivate`);
export const reactivateRoleRequest   = (id)     => client.patch(`/roles/${id}/activate`);
export const getRoleUsersRequest     = (id)     => client.get(`/roles/${id}/users`);
