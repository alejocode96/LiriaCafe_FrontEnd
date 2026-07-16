import client from './client';

export const getConfigRequest    = ()     => client.get('/cash-register/status');
export const updateConfigRequest = (data) => client.put('/cash-register/status', data);
