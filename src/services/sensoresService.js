import axios from 'axios';
import config from '../config/environment';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function toDateOnly(d) {
  if (!d) return undefined;
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().split('T')[0];
}

function getHistorialByTopic(topic, params = {}, { signal } = {}) {
  const qp = {
    topic,
    metric: params.metric,
    periodo: params.periodo || 'dia',
    order: params.order || 'desc',
    limit: params.limit || 200,
    fecha_desde: toDateOnly(params.fecha_desde),
    fecha_hasta: toDateOnly(params.fecha_hasta),
  };
  return api
    .get('/sensores/historial', { params: qp, signal })
    .then((res) => (res?.data?.items ? res.data.items : Array.isArray(res?.data) ? res.data : []));
}

const buildReportParams = (params = {}) => {
  const dateOnly = (d) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    return String(d);
  };
  const desde = params.fecha_desde || params.desde || params.fecha_inicio || params.start_date || params.date_from;
  const hasta = params.fecha_hasta || params.hasta || params.fecha_fin || params.end_date || params.date_to;
  const normalized = {};
  if (desde) {
    const v = dateOnly(desde);
    normalized.fecha_desde = v;
    normalized.desde = v;
    normalized.fecha_inicio = v;
  }
  if (hasta) {
    const v = dateOnly(hasta);
    normalized.fecha_hasta = v;
    normalized.hasta = v;
    normalized.fecha_fin = v;
  }
  if (params.topic) {
    normalized.topic = params.topic;
  }
  return normalized;
};

export const getSensores = () => api.get('/sensores');
export const getSensor = (id) => api.get(`/sensores/${id}`);
export const getHistorial = (id, params) =>
  api.get(`/sensores/${id}/historial`, { params }).then((res) => res?.data?.items || res?.data || []);
export const getRecomendaciones = (id) => api.get(`/sensores/${id}/recomendaciones`);

export const exportIotPdf = (params = {}) => {
  console.log('Exportando PDF IoT con parámetros:', buildReportParams(params));
  return api.get('/sensores/export/pdf', {
    params: buildReportParams(params),
    responseType: 'blob',
    timeout: 30000 // 30 segundos timeout
  })
  .then(response => {
    console.log('PDF exportado exitosamente');
    return response;
  })
  .catch(error => {
    console.error('Error exportando PDF:', error);
    throw error;
  });
};

export const exportIotExcel = (params = {}) => {
  console.log('Exportando Excel IoT con parámetros:', buildReportParams(params));
  return api.get('/sensores/export/excel', {
    params: buildReportParams(params),
    responseType: 'blob',
    timeout: 30000 
  })
  .then(response => {
    console.log('Excel exportado exitosamente');
    return response;
  })
  .catch(error => {
    console.error('Error exportando Excel:', error);
    throw error;
  });
};

export const subscribeTopic = (topic) => api.post('/sensores/subscribe', { topic });
export const unsubscribeTopic = (topic) => api.post('/sensores/unsubscribe', { topic });

export const getTiempoReal = () => api.get('/sensores/tiempo-real').then((r) => r?.data || []);
export const getTopics = () => api.get('/sensores/topics').then((r) => r?.data || []);

// Add makeRequest method for comprehensive reports
export const makeRequest = (endpoint, method = 'GET', params = {}, data = null) => {
  console.log(`Making ${method} request to ${endpoint} with params:`, params);

  const config = {
    method: method,
    url: endpoint,
    params: params,
    responseType: endpoint.includes('pdf') || endpoint.includes('excel') ? 'blob' : 'json',
    timeout: 30000
  };

  if (data) {
    config.data = data;
  }

  return api(config)
    .then(response => {
      console.log(`Request to ${endpoint} successful`);
      return response;
    })
    .catch(error => {
      console.error(`Error in ${method} request to ${endpoint}:`, error);
      throw error;
    });
};

const service = {
  getSensores,
  getSensor,
  getHistorial,
  getRecomendaciones,
  exportIotPdf,
  exportIotExcel,
  subscribeTopic,
  unsubscribeTopic,
  getHistorialByTopic,
  getTiempoReal,
  getTopics,
  makeRequest,
  createSensor: (payload) => api.post('/sensores', payload),
  updateSensor: (id, payload) => api.put(`/sensores/${id}`, payload),
  deleteSensor: (id) => api.delete(`/sensores/${id}`),
};

export default service;

