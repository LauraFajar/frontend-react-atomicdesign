import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapMovimiento = (m) => ({
  id: m.id_movimiento || m.id,
  id_insumo: Number(m.id_insumo || m.insumoId || m?.insumo?.id_insumo || m?.insumo?.id || 0),
  tipo_movimiento: (m.tipo_movimiento || m.tipo || '').toLowerCase(),
  cantidad: Number(m.cantidad || 0),
  unidad_medida: m.unidad_medida || m.unidad || '',
  fecha_movimiento: m.fecha_movimiento || m.fecha || m.createdAt || null,
  responsable: m.responsable || '',
  observacion: m.observacion || '',
  raw: m,
});

const movimientosService = {
  getMovimientos: async (filters = {}, page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 100));
    const params = new URLSearchParams();
    if (filters.id_insumo) params.append('id_insumo', filters.id_insumo);
    if (filters.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);
    params.append('page', safePage);
    params.append('limit', safeLimit);

    const url = `${API_URL}/movimientos${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get(url, { headers: getAuthHeader() });

    // Soporte para distintos formatos
    if (response.data?.items) {
      return { items: (response.data.items || []).map(mapMovimiento), meta: response.data.meta };
    }
    const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return { items: Array.isArray(data) ? data.map(mapMovimiento) : [], meta: { totalPages: 1, currentPage: 1 } };
  },
};

export default movimientosService;