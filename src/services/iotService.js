import axios from 'axios';
import env from '../config/environment';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: env.api.baseURL, // Backend en http://localhost:3000
  withCredentials: true,
});

// Adjuntar token automáticamente si está disponible
api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sensor endpoints
export const getAllSensors = async () => {
  try {
    const res = await api.get('/api/iot/sensors');
    return res.data.sensors || [];
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return [];
  }
};

export const getSensorById = (id) => api.get(`/api/iot/sensors/${id}`).then((res) => res.data.sensor);
export const createSensor = (sensorData) => api.post('/api/iot/sensors', sensorData).then((res) => res.data.sensor);
export const getSensorsByTopic = (topic) => api.get(`/api/iot/sensors/topic/${topic}`).then((res) => res.data.sensors);

// Reading endpoints
export const getReadings = async (deviceId, limit = 100) => {
  try {
    const res = await api.get(`/api/iot/readings/${deviceId}?limit=${limit}`);
    return res.data.readings || [];
  } catch (error) {
    console.error('Error fetching readings:', error);
    return [];
  }
};

export const getReadingsByTimeRange = (deviceId, startDate, endDate) =>
  api.get(`/api/iot/readings/${deviceId}/range?startDate=${startDate}&endDate=${endDate}`).then((res) => res.data.readings);

// Broker endpoints
export const getAllBrokers = () => api.get('/api/iot/brokers').then((res) => res.data.brokers);
export const getActiveBrokers = () => api.get('/api/iot/brokers/active').then((res) => res.data.brokers);
export const createBroker = (brokerData) => api.post('/api/iot/brokers', brokerData).then((res) => res.data.broker);
export const updateBroker = (id, brokerData) => api.put(`/api/iot/brokers/${id}`, brokerData).then((res) => res.data.broker);
export const deleteBroker = (id) => api.delete(`/api/iot/brokers/${id}`).then((res) => res.data.message);

// Dashboard endpoints
export const getDashboardData = () => api.get('/api/iot/dashboard').then((res) => res.data);
export const getLatestReadings = () => api.get('/api/iot/dashboard/readings').then((res) => res.data.readings);
export const getBrokersStatus = () => api.get('/api/iot/dashboard/brokers-status').then((res) => res.data.brokerStatus);

// Export endpoints (comprehensive)
export const exportToPdf = (params = {}) =>
  api.get('/api/iot/report/comprehensive/pdf', {
    params,
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
    validateStatus: (s) => s === 200 || s === 404 || s === 500,
  });

export const exportToExcel = (params = {}) =>
  api.get('/api/iot/report/comprehensive/excel', {
    params,
    responseType: 'blob',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    validateStatus: (s) => s === 200 || s === 404 || s === 500,
  });

const iotService = {
  getAllSensors,
  getSensorById,
  createSensor,
  getSensorsByTopic,
  getReadings,
  getReadingsByTimeRange,
  getAllBrokers,
  getActiveBrokers,
  createBroker,
  updateBroker,
  deleteBroker,
  getDashboardData,
  getLatestReadings,
  getBrokersStatus,
  exportToPdf,
  exportToExcel,
};

export default iotService;