import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Mapea al formato esperado por la UI de Inventario
const mapItem = (i) => ({
  // Usar siempre el ID primario del inventario para operaciones (update/delete)
  id: i?.id_inventario ?? i?.id,
  // Mantener referencia al insumo relacionado
  insumoId: i?.id_insumo ?? i?.insumo?.id_insumo ?? i?.insumo?.id,
  nombre: i?.insumo?.nombre_insumo ?? i?.nombre ?? i?.name ?? '',
  cantidad: Number(i?.cantidad_stock ?? i?.cantidad ?? i?.stock ?? 0),
  unidad: i?.unidad_medida ?? i?.unidad ?? i?.unit ?? '',
  ultima_fecha: i?.fecha ?? i?.ultima_fecha ?? i?.last_date ?? null,
  raw: i,
});

const inventoryService = {
  getItems: async (page = 1, limit = 50) => {
    const response = await axios.get(`${API_URL}/inventario`, {
      params: { page, limit },
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