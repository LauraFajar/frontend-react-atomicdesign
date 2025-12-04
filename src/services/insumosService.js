
import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
  return value;
};

const mapInsumo = (i) => {
  const flag = i?.es_herramienta;
  const esHerramienta = flag === true || flag === 1 || flag === '1' ||
    (typeof flag === 'string' && (flag.toLowerCase() === 'true' || flag.toLowerCase() === 't'));
  return {
    id: i?.id_insumo ?? i?.id,
    nombre: i?.nombre_insumo ?? i?.nombre ?? '',
    unidad: i?.unidad_medida ?? i?.unidad ?? '',
    codigo: i?.codigo ?? '',
    categoria: i?.id_categoria?.nombre ?? i?.categoria ?? '',
    almacen: i?.id_almacen?.nombre_almacen ?? i?.almacen ?? '',
    es_herramienta: esHerramienta,
    costo_compra: i?.costo_compra != null ? Number(i.costo_compra) : undefined,
    vida_util_horas: i?.vida_util_horas != null ? Number(i.vida_util_horas) : undefined,
    depreciacion_por_hora: i?.depreciacion_por_hora != null ? Number(i.depreciacion_por_hora) : undefined,
    depreciacion_acumulada: i?.depreciacion_acumulada != null ? Number(i.depreciacion_acumulada) : undefined,
    fecha_compra: i?.fecha_compra,
    raw: i,
  };
};

const insumosService = {
  getInsumos: async (page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 100));
    const response = await axios.get(`${API_URL}/insumos`, {
      params: { page: safePage, limit: safeLimit },
      headers: getAuthHeader(),
    });

    if (response.data?.items) {
      return (response.data.items || []).map(mapInsumo);
    }

    const data = response.data?.data ?? response.data;
    const list = Array.isArray(data) ? data : [];
    return list.map(mapInsumo);
  },

  createInsumo: async (data) => {
    const rawObs = data?.observacion;
    const obsSanitized = (() => {
      if (rawObs === undefined || rawObs === null) return 'Nuevo insumo';
      const s = String(rawObs).trim().slice(0, 50);
      return s.length ? s : 'N/A';
    })();
    const payload = {
      nombre_insumo: data.nombre ?? data.nombre_insumo,
      codigo: data.codigo,
      fecha_entrada: normalizeDate(data.fecha_entrada ?? data.fecha),
      observacion: obsSanitized,
      ...(data.es_herramienta !== undefined ? { es_herramienta: Boolean(data.es_herramienta) } : {}),
      ...(data.id_categoria != null ? { id_categoria: Number(data.id_categoria) } : {}),
      ...(data.id_almacen != null ? { id_almacen: Number(data.id_almacen) } : {}),
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const candidates = [
      `${API_URL}/insumos`,
      `${API_URL}/insumo`,
      `${API_URL}/api/insumos`,
    ];
    let lastError = null;
    for (const url of candidates) {
      try {
        console.log('[insumosService] POST', url, 'payload:', payload);
        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        });
        console.log('[insumosService] OK', url, 'status:', response.status);
        const created = response.data?.data ?? response.data;
        return mapInsumo(created);
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        console.warn('[insumosService] Falló', url, 'status:', status, 'data:', errorData);
        if (status !== 404) break;
      }
    }
    const errorData = lastError?.response?.data;
    const serverMsg = errorData?.message || errorData?.error || lastError?.message;
    throw new Error(serverMsg || 'No se pudo crear el insumo (ruta no encontrada)');
  },

  updateInsumo: async (id, data) => {
    const payload = {
      ...(data.nombre ?? data.nombre_insumo ? { nombre_insumo: data.nombre ?? data.nombre_insumo } : {}),
      ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
      ...(data.fecha_entrada ?? data.fecha ? { fecha_entrada: normalizeDate(data.fecha_entrada ?? data.fecha) } : {}),
      ...(data.observacion !== undefined ? { observacion: data.observacion } : {}),
      ...(data.es_herramienta !== undefined ? { es_herramienta: Boolean(data.es_herramienta) } : {}),
      ...(data.id_categoria !== undefined ? { id_categoria: Number(data.id_categoria) } : {}),
      ...(data.id_almacen !== undefined ? { id_almacen: Number(data.id_almacen) } : {}),
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const response = await axios.patch(`${API_URL}/insumos/${id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    const updated = response.data?.data ?? response.data;
    return mapInsumo(updated);
  },

  deleteInsumo: async (id) => {
    const response = await axios.delete(`${API_URL}/insumos/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default insumosService;
