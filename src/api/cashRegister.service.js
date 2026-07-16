import client from './client';

export const openCashRegisterRequest    = (data)   => client.post('/cash-register/open', data);
export const getCashRegisterCurrentRequest = ()    => client.get('/cash-register/current');
export const getCashRegisterStatusRequest  = ()    => client.get('/cash-register/status');
export const closeCashRegisterRequest   = (data)   => client.post('/cash-register/close', data);
export const getCashRegisterHistoryRequest = (params) => client.get('/cash-register/history', { params });
export const getCashRegisterByIdRequest = (id)     => client.get(`/cash-register/${id}`);
