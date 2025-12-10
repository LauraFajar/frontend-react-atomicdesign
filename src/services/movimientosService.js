import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapMovimiento = (m) => {
  const rawInsumo = m.id_insumo ?? m.insumo;
  const nestedId = typeof rawInsumo === 'object' ? (rawInsumo.id_insumo || rawInsumo.id) : rawInsumo;
  
  let categoriaNombre = '';
  let almacenNombre = '';
  
  if (typeof rawInsumo === 'object') {
    categoriaNombre = rawInsumo?.id_categoria?.nombre ?? 
                     rawInsumo?.categoria?.nombre ?? 
                     rawInsumo?.categoria_nombre ?? 
                     rawInsumo?.nombre_categoria ?? '';
    
    almacenNombre = rawInsumo?.id_almacen?.nombre_almacen ?? 
                   rawInsumo?.almacen?.nombre_almacen ?? 
                   rawInsumo?.almacen_nombre ?? 
                   rawInsumo?.nombre_almacen ?? '';
  }
  
  return {
    id: m.id_movimiento || m.id,
    id_insumo: Number(nestedId || m.insumoId || m?.insumo?.id_insumo || m?.insumo?.id || 0),
    nombre: typeof rawInsumo === 'object' ? (rawInsumo.nombre_insumo || '') : '',
    tipo_movimiento: (m.tipo_movimiento || m.tipo || '').toLowerCase(),
    cantidad: Number(m.cantidad || 0),
    unidad_medida: m.unidad_medida || m.unidad || '',
    fecha_movimiento: m.fecha_movimiento || m.fecha || m.createdAt || null,
    responsable: m.responsable || '',
    observacion: m.observacion || '',
    insumo_categoria: categoriaNombre,
    insumo_almacen: almacenNombre,
    id_categoria: typeof rawInsumo === 'object' ? 
      (rawInsumo?.id_categoria?.id ?? rawInsumo?.id_categoria?.id_categoria ?? rawInsumo?.id_categoria) : null,
    id_almacen: typeof rawInsumo === 'object' ? 
      (rawInsumo?.id_almacen?.id ?? rawInsumo?.id_almacen?.id_almacen ?? rawInsumo?.id_almacen) : null,
    raw: m,
  };
};

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
  createMovimiento: async (payload = {}) => {
    const normalizeDate = (value) => {
      if (!value) {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      return String(value);
    };

    const body = {
      tipo_movimiento: String(payload.tipo_movimiento || '').toLowerCase() === 'salida' ? 'Salida' : 'Entrada',
      cantidad: Number(payload.cantidad || 0),
      unidad_medida: (payload.unidad_medida || payload.unidad || 'unidad').trim(),
      fecha_movimiento: normalizeDate(payload.fecha_movimiento || payload.fecha),
      responsable: payload.responsable,
      observacion: payload.observacion,
      id_cultivo: payload.id_cultivo != null ? Number(payload.id_cultivo) : undefined,
      valor_unidad: payload.valor_unidad != null ? Number(payload.valor_unidad) : undefined,
    };
    const urlDefault = `${API_URL}/movimientos`;
    const urlByInsumo = `${API_URL}/insumos/${Number(payload.id_insumo)}/movimientos`;
    const urlWithQuery = `${API_URL}/movimientos?id_insumo=${encodeURIComponent(Number(payload.id_insumo))}`;
    let lastErr;
    try {
      const response = await axios.post(urlByInsumo, body, { headers: getAuthHeader() });
      return mapMovimiento(response.data);
    } catch (e1) {
      lastErr = e1;
      try {
        const response2 = await axios.post(urlWithQuery, body, { headers: getAuthHeader() });
        return mapMovimiento(response2.data);
      } catch (e2) {
        lastErr = e2;
      }
      try {
        const response3 = await axios.post(urlDefault, { ...body, id_insumo: Number(payload.id_insumo) }, { headers: getAuthHeader() });
        return mapMovimiento(response3.data);
      } catch (e3) {
        lastErr = e3;
      }
    }
    const errorData = lastErr?.response?.data;
    const serverMsg = errorData?.message || errorData?.error || lastErr?.message;
    throw new Error(serverMsg || 'No se pudo crear el movimiento');
  },
  updateMovimiento: async (id, payload = {}) => {
    const normalizeDate = (value) => {
      if (!value) return undefined;
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      return String(value);
    };

    const body = {
      tipo_movimiento: payload.tipo_movimiento ? (String(payload.tipo_movimiento).toLowerCase() === 'salida' ? 'Salida' : 'Entrada') : undefined,
      cantidad: payload.cantidad != null ? Number(payload.cantidad) : undefined,
      unidad_medida: payload.unidad_medida || payload.unidad,
      fecha_movimiento: normalizeDate(payload.fecha_movimiento || payload.fecha),
      responsable: payload.responsable,
      observacion: payload.observacion,
    };

    const url = `${API_URL}/movimientos/${id}`;
    const response = await axios.patch(url, body, { headers: getAuthHeader() });
    return mapMovimiento(response.data);
  },
  deleteMovimiento: async (id) => {
    const url = `${API_URL}/movimientos/${id}`;
    const response = await axios.delete(url, { headers: getAuthHeader() });
    return response.data;
  },
};

export default movimientosService;
