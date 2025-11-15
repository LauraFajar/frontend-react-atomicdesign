import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapItem = (i) => ({
  id: i?.id_inventario ?? i?.id,
  insumoId: i?.id_insumo ?? i?.insumo?.id_insumo ?? i?.insumo?.id,
  nombre: i?.insumo?.nombre_insumo ?? i?.nombre ?? i?.name ?? '',
  cantidad: Number(i?.cantidad_stock ?? i?.cantidad ?? i?.stock ?? 0),
  unidad: i?.unidad_medida ?? i?.unidad ?? i?.unit ?? '',
  ultima_fecha: i?.fecha ?? i?.ultima_fecha ?? i?.last_date ?? null,
  categoria: i?.insumo?.id_categoria?.nombre ?? i?.categoria ?? '',
  almacen: i?.insumo?.id_almacen?.nombre_almacen ?? i?.almacen ?? '',
  idCategoria: (() => {
    const rel = i?.insumo?.id_categoria ?? i?.id_categoria;
    const id = typeof rel === 'object' ? (rel?.id ?? rel?.id_categoria) : rel;
    return id != null ? Number(id) : undefined;
  })(),
  idAlmacen: (() => {
    const rel = i?.insumo?.id_almacen ?? i?.id_almacen;
    const id = typeof rel === 'object' ? (rel?.id ?? rel?.id_almacen) : rel;
    return id != null ? Number(id) : undefined;
  })(),
  raw: i,
});

const inventoryService = {
  getItems: async (page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 100));
    const response = await axios.get(`${API_URL}/inventario`, {
      params: { page: safePage, limit: safeLimit },
      headers: getAuthHeader(),
    });

    if (response.data?.items) {
      return {
        items: response.data.items.map(mapItem),
        meta: response.data.meta,
      };
    }

    const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return {
      items: Array.isArray(data) ? data.map(mapItem) : [],
      meta: { totalPages: 1, currentPage: 1 },
    };
  },

  getLowStock: async (limite = 10) => {
    const response = await axios.get(`${API_URL}/inventario/stock-bajo`, {
      params: { limite },
      headers: getAuthHeader(),
    });
    const items = Array.isArray(response.data?.items)
      ? response.data.items.map(mapItem)
      : [];
    return { items, limite_configurado: response.data?.limite_configurado ?? limite };
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/inventario/estadisticas`, {
      headers: getAuthHeader(),
    });
    return response.data || {};
  },

  createItem: async (item) => {
    const payload = {
      id_insumo: Number(item.id_insumo ?? item.insumoId),
      cantidad_stock: Number(item.cantidad),
      unidad_medida: item.unidad,
      fecha: item.ultima_fecha,
    };
    const response = await axios.post(`${API_URL}/inventario`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return mapItem(response.data);
  },

  updateItem: async (id, item) => {
    const payload = {
      ...(item.id_insumo !== undefined || item.insumoId !== undefined
        ? { id_insumo: Number(item.id_insumo ?? item.insumoId) }
        : {}),
      ...(item.cantidad !== undefined ? { cantidad_stock: Number(item.cantidad) } : {}),
      ...(item.unidad !== undefined ? { unidad_medida: item.unidad } : {}),
      ...(item.ultima_fecha !== undefined ? { fecha: item.ultima_fecha } : {}),
    };
    const response = await axios.patch(`${API_URL}/inventario/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return mapItem(response.data);
  },

  deleteItem: async (id) => {
    const response = await axios.delete(`${API_URL}/inventario/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default inventoryService;