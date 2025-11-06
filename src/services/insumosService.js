
import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Normaliza fechas a formato YYYY-MM-DD aceptado por el backend
const normalizeDate = (value) => {
  if (!value) return undefined;
  // Si viene como Date o ISO, convertir a YYYY-MM-DD
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  // Si ya viene como YYYY-MM-DD, devolver tal cual
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value;
};

// Normaliza la respuesta del backend al formato usado por la UI
const mapInsumo = (i) => ({
  id: i?.id_insumo ?? i?.id,
  nombre: i?.nombre_insumo ?? i?.nombre ?? '',
  unidad: i?.unidad_medida ?? i?.unidad ?? '',
  codigo: i?.codigo ?? '',
  raw: i,
});

const insumosService = {
  // Lista de insumos con soporte para distintos formatos de respuesta
  getInsumos: async (page = 1, limit = 100) => {
    const response = await axios.get(`${API_URL}/insumos`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });

    // Soporte para { items, meta }
    if (response.data?.items) {
      return (response.data.items || []).map(mapInsumo);
    }

    // Soporte para { data }
    const data = response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return list.map(mapInsumo);
  },

  // Crear un insumo
  createInsumo: async (data) => {
    // Adaptar payload al backend: SOLO acepta nombre_insumo, codigo, fecha_entrada, observacion
    const payload = {
      nombre_insumo: data.nombre ?? data.nombre_insumo,
      codigo: data.codigo,
      fecha_entrada: normalizeDate(data.fecha_entrada ?? data.fecha),
      observacion: data.observacion,
    };

    // Eliminar claves undefined para evitar enviar propiedades vacías
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const response = await axios.post(`${API_URL}/insumos`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const created = response.data?.data ?? response.data;
    return mapInsumo(created);
  },

  // Actualizar un insumo
  updateInsumo: async (id, data) => {
    const payload = {
      ...(data.nombre ?? data.nombre_insumo ? { nombre_insumo: data.nombre ?? data.nombre_insumo } : {}),
      ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
      ...(data.fecha_entrada ?? data.fecha ? { fecha_entrada: normalizeDate(data.fecha_entrada ?? data.fecha) } : {}),
      ...(data.observacion !== undefined ? { observacion: data.observacion } : {}),
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const response = await axios.patch(`${API_URL}/insumos/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const updated = response.data?.data ?? response.data;
    return mapInsumo(updated);
  },

  // Eliminar un insumo
  deleteInsumo: async (id) => {
    const response = await axios.delete(`${API_URL}/insumos/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default insumosService;