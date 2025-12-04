import axios from 'axios';
import config from '../config/environment';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: config.api.baseURL,
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

export const getSensorById = (id) => 
  api.get(`/api/iot/sensors/${id}`).then(res => res.data.sensor);

export const createSensor = (sensorData) => 
  api.post('/api/iot/sensors', sensorData).then(res => res.data.sensor);

export const getSensorsByTopic = (topic) => 
  api.get(`/api/iot/sensors/topic/${topic}`).then(res => res.data.sensors);

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
  api.get(`/api/iot/readings/${deviceId}/range?startDate=${startDate}&endDate=${endDate}`).then(res => res.data.readings);

// Broker endpoints
export const getAllBrokers = () => 
  api.get('/api/iot/brokers').then(res => res.data.brokers);

export const getActiveBrokers = () => 
  api.get('/api/iot/brokers/active').then(res => res.data.brokers);

export const createBroker = (brokerData) => 
  api.post('/api/iot/brokers', brokerData).then(res => res.data.broker);

export const updateBroker = (id, brokerData) => 
  api.put(`/api/iot/brokers/${id}`, brokerData).then(res => res.data.broker);

export const deleteBroker = (id) => 
  api.delete(`/api/iot/brokers/${id}`).then(res => res.data.message);

export const getDashboardData = () => 
  api.get('/api/iot/dashboard').then(res => res.data);

export const getLatestReadings = () => 
  api.get('/api/iot/dashboard/readings').then(res => res.data.readings);

export const getBrokersStatus = () => 
  api.get('/api/iot/dashboard/brokers-status').then(res => res.data.brokerStatus);

export const exportToPdf = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/api/iot/export/pdf?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

export const exportToExcel = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/api/iot/export/excel?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response;
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
};

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