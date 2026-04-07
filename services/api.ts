import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = (email: string, password: string) =>
  api.post('/auth/token/', { email, password });

export const register = (data: any) => api.post('/users/register/', data);
export const getWallets = () => api.get('/wallets/');
export const createWallet = (data: any) => api.post('/wallets/', data);
export const getTransactions = (walletId?: number, params?: any) =>
  api.get('/transactions/', { params: { wallet_id: walletId, ...params } });
export const createTransaction = (data: any) => api.post('/transactions/', data);
export const deleteTransaction = (id: number) => api.delete(`/transactions/${id}/`);
export const getCategories = (walletId?: number) =>
  api.get('/categories/', { params: { wallet_id: walletId } });
export const getCurrencies = () => api.get('/currencies/');
export const getDashboard = (walletId: number) =>
  api.get(`/insights/wallet/${walletId}/dashboard/`);
