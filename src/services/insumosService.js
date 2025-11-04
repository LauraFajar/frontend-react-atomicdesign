import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapInsumo = (i) => ({
  id: i?.id_insumo ?? i?.id,
  nombre: i?.nombre_insumo ?? i?.nombre ?? '',
  unidad: i?.unidad_medida ?? i?.unidad ?? '',
  raw: i,
});

const insumosService = {
  getInsumos: async (page = 1, limit = 100) => {
    const response = await axios.get(`${API_URL}/insumos`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });

    const data = response.data?.items ?? response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return list.map(mapInsumo);
  },

  createInsumo: async (data) => {
    const payload = {
      nombre_insumo: data.nombre ?? data.nombre_insumo,
      unidad_medida: data.unidad ?? data.unidad_medida,
      codigo: data.codigo,
      id_insumo: data.id ? Number(data.id) : undefined,
      fecha: data.fecha,
    };
    const response = await axios.post(`${API_URL}/insumos`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const created = response.data?.data ?? response.data;
    return mapInsumo(created);
  },
};

export default insumosService;