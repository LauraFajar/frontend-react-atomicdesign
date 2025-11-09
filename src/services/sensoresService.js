import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapSensor = (s) => ({
  id: s?.id_sensor ?? s?.id,
  tipo_sensor: s?.tipo_sensor ?? s?.tipo ?? '',
  estado: s?.estado ?? 'activo',
  valor_minimo: Number(s?.valor_minimo ?? 0),
  valor_maximo: Number(s?.valor_maximo ?? 0),
  valor_actual: s?.valor_actual != null ? Number(s?.valor_actual) : null,
  ultima_lectura: s?.ultima_lectura ?? null,
  configuracion: s?.configuracion ?? null,
  raw: s,
});

const sensoresService = {
  getSensores: async (page = 1, limit = 50) => {
    const response = await axios.get(`${API_URL}/sensores`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });
    const data = response.data?.items ?? response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return { items: list.map(mapSensor) };
  },

  createSensor: async (payload) => {
    const body = {
      tipo_sensor: String(payload?.tipo_sensor || '').trim(),
      estado: String(payload?.estado || 'activo').trim(),
      valor_minimo: Number(payload?.valor_minimo ?? 0),
      valor_maximo: Number(payload?.valor_maximo ?? 0),
      unidad_medida: payload?.unidad_medida ? String(payload.unidad_medida).trim() : undefined,
      ubicacion: payload?.ubicacion ? String(payload.ubicacion).trim() : undefined,
    };
    const response = await axios.post(`${API_URL}/sensores`, body, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const created = response.data?.data ?? response.data;
    return mapSensor(created);
  },

  updateSensor: async (id, data) => {
    const body = {
      ...(data?.tipo_sensor ? { tipo_sensor: String(data.tipo_sensor).trim() } : {}),
      ...(data?.estado ? { estado: String(data.estado).trim() } : {}),
      ...(data?.valor_minimo != null ? { valor_minimo: Number(data.valor_minimo) } : {}),
      ...(data?.valor_maximo != null ? { valor_maximo: Number(data.valor_maximo) } : {}),
      ...(data?.unidad_medida ? { unidad_medida: String(data.unidad_medida).trim() } : {}),
      ...(data?.ubicacion ? { ubicacion: String(data.ubicacion).trim() } : {}),
    };
    const response = await axios.patch(`${API_URL}/sensores/${id}`, body, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const updated = response.data?.data ?? response.data;
    return mapSensor(updated);
  },

  deleteSensor: async (id) => {
    await axios.delete(`${API_URL}/sensores/${id}`, {
      headers: getAuthHeader(),
    });
    return true;
  },

  registrarLectura: async (id, valor, unidad_medida, observaciones) => {
    const response = await axios.post(
      `${API_URL}/sensores/${id}/lectura`,
      { valor: Number(valor), unidad_medida, observaciones },
      { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } }
    );
    const updated = response.data?.data ?? response.data;
    return updated;
  },
};

export default sensoresService;