import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const financeService = {
  // Resumen por cultivo y período
  getResumen: async ({ cultivoId, from, to, groupBy, tipo }) => {
    const params = new URLSearchParams({ cultivoId, from, to, groupBy });
    if (tipo && tipo !== 'todos') params.append('tipo', tipo);
    const url = `${API_URL}/finanzas/resumen?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  // Margen por cultivo (lista)
  getMargenLista: async ({ from, to }) => {
    const params = new URLSearchParams({ from, to });
    const url = `${API_URL}/finanzas/margen?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  getGastosComparativo: async ({ from, to, by }) => {
    const params = new URLSearchParams({ from, to, by });
    const url = `${API_URL}/finanzas/gastos-comparativo?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  getIngresos: async ({ cultivoId, from, to }) => {
    const params = new URLSearchParams({ cultivoId, from, to });
    const url = `${API_URL}/ingresos?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  getSalidas: async ({ cultivoId, from, to }) => {
    const params = new URLSearchParams({ cultivoId, from, to });
    const url = `${API_URL}/salidas?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  getActividades: async ({ cultivoId, from, to }) => {
    const params = new URLSearchParams({ cultivoId, from, to });
    const url = `${API_URL}/actividades?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  },

  exportExcel: async ({ cultivoId, from, to, groupBy, tipo }) => {
    const params = new URLSearchParams({ cultivoId, from, to, groupBy });
    if (tipo && tipo !== 'todos') params.append('tipo', tipo);
    const url = `${API_URL}/finanzas/export/excel?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader(), responseType: 'blob' });
    return response.data;
  },

  exportPdf: async ({ cultivoId, from, to, groupBy, tipo }) => {
    const params = new URLSearchParams({ cultivoId, from, to, groupBy });
    if (tipo && tipo !== 'todos') params.append('tipo', tipo);
    const url = `${API_URL}/finanzas/export/pdf?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader(), responseType: 'blob' });
    return response.data;
  },
};

export default financeService;