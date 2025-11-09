import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapCategoria = (c) => ({
  id: c?.id_categoria ?? c?.id,
  nombre: c?.nombre ?? c?.name ?? '',
  descripcion: c?.descripcion ?? '',
  raw: c,
});

const categoriasService = {
  getCategorias: async (page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 100));
    const response = await axios.get(`${API_URL}/categorias`, {
      params: { page: safePage, limit: safeLimit },
      headers: getAuthHeader(),
    });

    if (response.data?.items) {
      return {
        items: (response.data.items || []).map(mapCategoria),
        meta: response.data.meta,
      };
    }

    const data = response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return {
      items: list.map(mapCategoria),
      meta: { totalPages: 1, currentPage: 1 },
    };
  },
  createCategoria: async (data) => {
    const payload = {
      nombre: data?.nombre ?? data?.name,
      descripcion: data?.descripcion ?? '',
    };
    const response = await axios.post(`${API_URL}/categorias`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const created = response.data?.data ?? response.data;
    return mapCategoria(created);
  },

  updateCategoria: async (id, data) => {
    const payload = {
      ...(data?.nombre ?? data?.name ? { nombre: data?.nombre ?? data?.name } : {}),
      ...(data?.descripcion !== undefined ? { descripcion: data?.descripcion } : {}),
    };
    const response = await axios.patch(`${API_URL}/categorias/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const updated = response.data?.data ?? response.data;
    return mapCategoria(updated);
  },

  deleteCategoria: async (id) => {
    const response = await axios.delete(`${API_URL}/categorias/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default categoriasService;