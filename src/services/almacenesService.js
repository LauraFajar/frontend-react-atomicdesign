import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapAlmacen = (a) => ({
  id: a?.id_almacen ?? a?.id,
  nombre: a?.nombre_almacen ?? a?.nombre ?? '',
  descripcion: a?.descripcion ?? '',
  raw: a,
});

const almacenesService = {
  getAlmacenes: async (page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 100));
    const response = await axios.get(`${API_URL}/almacenes`, {
      params: { page: safePage, limit: safeLimit },
      headers: getAuthHeader(),
    });

    if (response.data?.items) {
      return {
        items: (response.data.items || []).map(mapAlmacen),
        meta: response.data.meta,
      };
    }

    const data = response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return {
      items: list.map(mapAlmacen),
      meta: { totalPages: 1, currentPage: 1 },
    };
  },
  createAlmacen: async (data) => {
    const payload = {
      nombre_almacen: data?.nombre ?? data?.nombre_almacen,
      descripcion: data?.descripcion ?? '',
    };
    const response = await axios.post(`${API_URL}/almacenes`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const created = response.data?.data ?? response.data;
    return mapAlmacen(created);
  },

  updateAlmacen: async (id, data) => {
    const payload = {
      ...(data?.nombre ?? data?.nombre_almacen ? { nombre_almacen: data?.nombre ?? data?.nombre_almacen } : {}),
      ...(data?.descripcion !== undefined ? { descripcion: data?.descripcion } : {}),
    };
    const response = await axios.patch(`${API_URL}/almacenes/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const updated = response.data?.data ?? response.data;
    return mapAlmacen(updated);
  },

  deleteAlmacen: async (id) => {
    const response = await axios.delete(`${API_URL}/almacenes/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default almacenesService;