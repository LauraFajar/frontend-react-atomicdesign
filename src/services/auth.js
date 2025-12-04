import { api } from './api';

export async function login(numero_documento, password) {
  const payload = { numero_documento, password };
  const { data } = await api.post('/auth/login', payload);
  // Optional: persist token
  if (data?.access_token) {
    try {
      localStorage.setItem('access_token', data.access_token);
    } catch {}
  }
  return data;
}