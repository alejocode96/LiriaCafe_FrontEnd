import client from './client';

export const getUsersRequest = (params) => client.get('/users', { params });
export const getUserByIdRequest = (id) => client.get(`/users/${id}`);
export const createUserRequest = (data) => client.post('/users', data);
export const updateUserRequest = (id, data) => client.put(`/users/${id}`, data);
export const deactivateUserRequest = (id) => client.patch(`/users/${id}/deactivate`);
export const reactivateUserRequest = (id) => client.patch(`/users/${id}/reactivate`);
export const unlockUserRequest = (id) => client.patch(`/users/${id}/unlock`);
export const forcePasswordChangeRequest = (id) => client.patch(`/users/${id}/force-password-change`);
export const getRolesRequest = (params) => client.get('/roles', { params });
export const checkUsernameAvailabilityRequest = (username, excludeId) =>
  client.get('/users/check-username', { params: { username, excludeId } });
export const checkEmailAvailabilityRequest = (email, excludeId) =>
  client.get('/users/check-email', { params: { email, excludeId } });
