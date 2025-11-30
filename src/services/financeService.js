import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const financeService = {
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

  getRentabilidad: async ({ cultivoId, from, to, criterio, umbral }) => {
    const params = new URLSearchParams({ cultivoId, from, to });
    if (criterio) params.append('criterio', criterio);
    if (typeof umbral !== 'undefined' && umbral !== null && umbral !== '') params.append('umbral', umbral);
    const url = `${API_URL}/finanzas/rentabilidad?${params.toString()}`;
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

  createIngreso: async ({ cultivoId, fecha, monto, descripcion, id_insumo } = {}) => {
    const payload = {
      fecha_ingreso: fecha,
      monto: Number(monto),
      descripcion: descripcion ?? 'Ingreso',
      ...(cultivoId != null ? { id_cultivo: Number(cultivoId) } : {}),
      ...(id_insumo != null ? { id_insumo: Number(id_insumo) } : {}),
    };
    const url = `${API_URL}/ingresos`;
    const response = await axios.post(url, payload, { headers: getAuthHeader() });
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

  exportExcel: async ({ cultivoId, from, to, groupBy, tipo, nombreCultivo }) => {
    const params = new URLSearchParams({ cultivoId, from, to, groupBy });
    if (nombreCultivo) params.append('nombre_cultivo', nombreCultivo);
    if (tipo && tipo !== 'todos') params.append('tipo', tipo);
    const url = `${API_URL}/finanzas/resumen/excel?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader(), responseType: 'blob' });
    return response.data;
  },

  exportPdf: async ({ cultivoId, from, to, groupBy, tipo, nombreCultivo }) => {
    const params = new URLSearchParams({ cultivoId, from, to, groupBy });
    if (nombreCultivo) params.append('nombre_cultivo', nombreCultivo);
    if (tipo && tipo !== 'todos') params.append('tipo', tipo);
    const url = `${API_URL}/finanzas/resumen/pdf?${params.toString()}`;
    const response = await axios.get(url, { headers: getAuthHeader(), responseType: 'blob' });
    return response.data;
  },
};

export default financeService;