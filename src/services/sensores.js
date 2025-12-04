import axios from 'axios';
import config from '../config/environment';

const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
});

// Adjuntar token automáticamente si está disponible
api.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!cfg.headers) cfg.headers = {};
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return cfg;
});

export const subscribeTopic = async (topic) => {
  const response = await api.post('/sensores/subscribe', { topic });
  return response.data;
};

export const unsubscribeTopic = async (topic) => {
  const response = await api.post('/sensores/unsubscribe', { topic });
  return response.data;
};

export const getLastReading = async (topic) => {
  const response = await api.get(`/sensores/${encodeURIComponent(topic)}/last`);
  return response.data;
};