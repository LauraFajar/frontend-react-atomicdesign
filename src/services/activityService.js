import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapActivity = (a) => ({
  id: a.id_actividad || a.id,
  tipo_actividad: a.tipo_actividad ?? a.tipo_de_actividad ?? a.tipo ?? a.tipoActividad ?? a.tipoDeActividad,
  fecha: a.fecha_actividad ?? a.fecha,
  responsable: a.responsable ?? a.usuario?.nombres ?? a.user ?? a?.responsableUsuario?.nombres,
  responsable_id: a.responsable_id ?? a?.responsableUsuario?.id_usuarios ?? a?.usuario?.id_usuarios ?? a?.user?.id,
  detalles: a.detalles ?? a.descripcion ?? a.description,
  estado: a.estado,
  id_cultivo: a.id_cultivo ?? a.cultivoId,
  costo_mano_obra: a.costo_mano_obra ?? a.costoManoObra ?? a.costo_mano ?? null,
  costo_maquinaria: a.costo_maquinaria ?? a.costoMaquinaria ?? null,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  raw: a
});

const activityService = {
  getActivities: async (filters = {}, page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams();
      const idVal = filters?.id_cultivo;
      const hasId = idVal !== undefined && idVal !== null && idVal !== '' && !Number.isNaN(Number(idVal));
      if (hasId) params.append('id_cultivo', String(Number(idVal)));
      const safePage = Number(page);
      const safeLimit = Number(limit);
      params.append('page', String(Number.isFinite(safePage) && safePage > 0 ? safePage : 1));
      params.append('limit', String(Number.isFinite(safeLimit) && safeLimit > 0 ? Math.min(safeLimit, 100) : 10));

      const queryString = params.toString();
      const url = `${API_URL}/actividades${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url, {
        headers: getAuthHeader()
      });

      if (response.data && response.data.items) {
        return {
          items: response.data.items.map(mapActivity),
          meta: response.data.meta
        };
      }

      const data = Array.isArray(response.data) ? response.data.map(mapActivity) : response.data;
      return {
        items: data,
        meta: { totalPages: 1, currentPage: 1 }
      };

    } catch (error) {
      console.error('Error al obtener actividades:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver las actividades');
      }
      throw error;
    }
  },

  getActivityById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${id}`, {
        headers: getAuthHeader()
      });
      const base = mapActivity(response.data);
      try {
        const recursosResp = await axios.get(`${API_URL}/actividades/${id}/recursos`, { headers: getAuthHeader() });
        const recursos = Array.isArray(recursosResp.data) ? recursosResp.data.map(r => ({
          id_insumo: Number(r.id_insumo),
          cantidad: r.cantidad != null ? Number(r.cantidad) : undefined,
          horas_uso: r.horas_uso != null ? Number(r.horas_uso) : undefined,
          costo_unitario: r.costo_unitario != null ? Number(r.costo_unitario) : undefined,
        })) : [];
        return { ...base, recursos };
      } catch {
        return base;
      }
    } catch (error) {
      console.error('Error al obtener la actividad:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver esta actividad');
      }
      throw error;
    }
  },

  getRecursosByActividad: async (actividadId) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${actividadId}/recursos`, {
        headers: getAuthHeader()
      });
      const arr = Array.isArray(response.data) ? response.data : (response.data?.items || response.data?.data || []);
      return arr.map(r => ({
        id_insumo: Number(r.id_insumo ?? r.id ?? 0),
        nombre_insumo: r.nombre_insumo ?? r.nombre ?? '',
        es_herramienta: Boolean(r.es_herramienta),
        cantidad: r.cantidad != null ? Number(r.cantidad) : undefined,
        horas_uso: r.horas_uso != null ? Number(r.horas_uso) : undefined,
        costo_unitario: r.costo_unitario != null ? Number(r.costo_unitario) : undefined,
      }));
    } catch (error) {
      console.error('Error al obtener recursos de la actividad:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los recursos');
      }
      throw error;
    }
  },

  createActivity: async (activityData) => {
    try {
      const normalizeType = (v) => {
        const s = String(v || '').toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const map = {
          siembra: 'siembra',
          riego: 'riego',
          fertilizacion: 'fertilizacion',
          fertilización: 'fertilizacion',
          poda: 'poda',
          cosecha: 'cosecha',
          otro: 'otro',
          control_plagas: 'otro',
          mantenimiento: 'otro',
          aplicacion: 'otro',
          aplicación: 'otro',
          general: 'otro'
        };
        return map[s] || 'otro';
      };
      const body = {
        fecha: activityData?.fecha || activityData?.fecha_actividad || new Date().toISOString(),
        id_cultivo: activityData?.id_cultivo != null ? Number(activityData.id_cultivo) : undefined,
        detalles: activityData?.detalles != null ? String(activityData.detalles).trim() : undefined,
        responsable: activityData?.responsable != null ? String(activityData.responsable).trim() : undefined,
        responsable_id: activityData?.responsable_id != null ? Number(activityData.responsable_id) : undefined,
        costo_mano_obra: activityData?.costo_mano_obra != null ? Number(activityData.costo_mano_obra) : undefined,
        costo_maquinaria: activityData?.costo_maquinaria != null ? Number(activityData.costo_maquinaria) : undefined,
        recursos: Array.isArray(activityData?.recursos) ? activityData.recursos.map(r => ({
          id_insumo: Number(r.id_insumo),
          cantidad: r.cantidad != null ? Number(r.cantidad) : undefined,
          horas_uso: r.horas_uso != null ? Number(r.horas_uso) : undefined,
          costo_unitario: r.costo_unitario != null ? Number(r.costo_unitario) : undefined,
        })) : undefined,
        tipo_actividad: normalizeType(activityData?.tipo_actividad ?? activityData?.tipoDeActividad)
      };
      console.log('[activityService] POST /actividades payload:', body);
      const response = await axios.post(`${API_URL}/actividades`, body, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      return mapActivity(response.data);
    } catch (error) {
      console.error('Error al crear la actividad:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para crear actividades');
        }
        const msg = error.response?.data?.message || error.message;
        if (/tipo_?de_?actividad/i.test(String(msg))) {
          throw new Error('El tipo de actividad no es válido');
        }
      }
      throw error;
    }
  },

  updateActivity: async (id, activityData) => {
    try {
      const normalizeType = (v) => {
        const s = String(v || '').toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const map = {
          siembra: 'siembra',
          riego: 'riego',
          fertilizacion: 'fertilizacion',
          fertilización: 'fertilizacion',
          poda: 'poda',
          cosecha: 'cosecha',
          otro: 'otro',
          control_plagas: 'otro',
          mantenimiento: 'otro',
          aplicacion: 'otro',
          aplicación: 'otro',
          general: 'otro'
        };
        return map[s] || undefined;
      };
      const body = {
        ...(activityData?.fecha || activityData?.fecha_actividad ? { fecha: activityData.fecha || activityData.fecha_actividad } : {}),
        ...(activityData?.id_cultivo != null ? { id_cultivo: Number(activityData.id_cultivo) } : {}),
        ...(activityData?.detalles != null ? { detalles: String(activityData.detalles).trim() } : {}),
        ...(activityData?.responsable_id != null ? { responsable_id: Number(activityData.responsable_id) } : {}),
        ...(activityData?.responsable != null ? { responsable: String(activityData.responsable).trim() } : {}),
        ...(activityData?.costo_mano_obra != null ? { costo_mano_obra: Number(activityData.costo_mano_obra) } : {}),
        ...(activityData?.costo_maquinaria != null ? { costo_maquinaria: Number(activityData.costo_maquinaria) } : {}),
        ...(Array.isArray(activityData?.recursos) ? { recursos: activityData.recursos.map(r => ({
          id_insumo: Number(r.id_insumo),
          cantidad: r.cantidad != null ? Number(r.cantidad) : undefined,
          horas_uso: r.horas_uso != null ? Number(r.horas_uso) : undefined,
          costo_unitario: r.costo_unitario != null ? Number(r.costo_unitario) : undefined,
        })) } : {}),
        ...(activityData?.tipo_actividad || activityData?.tipoDeActividad ? { tipo_actividad: normalizeType(activityData.tipo_actividad ?? activityData.tipoDeActividad) } : {})
      };
      console.log('[activityService] PATCH /actividades/' + id + ' payload:', body);
      const response = await axios.patch(`${API_URL}/actividades/${id}`, body, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      return mapActivity(response.data);
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para actualizar esta actividad');
        }
        const msg = error.response?.data?.message || error.message;
        if (/tipo_?de_?actividad/i.test(String(msg))) {
          throw new Error('El tipo de actividad no es válido');
        }
      }
      throw error;
    }
  },

  deleteActivity: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/actividades/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar la actividad:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar actividades');
      }
      throw error;
    }
  },

  uploadPhoto: async (id, { file, description }) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('descripcion', description);

      const response = await axios.post(`${API_URL}/actividades/upload-photo/${id}`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir la foto:', error);
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión de nuevo.');
        }
        if (error.response.status === 404) {
          throw new Error('La actividad no fue encontrada.');
        }
        if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Datos inválidos. Asegúrate de incluir una imagen y una descripción.');
        }
      }
      throw new Error('Ocurrió un error inesperado al subir la foto.');
    }
  },

  getActivityPhotos: async (activityId) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${activityId}/photos`, {
        headers: getAuthHeader(),
      });
      const data = Array.isArray(response.data) ? response.data : [];
      return data.map(p => ({
        ...p,
        ruta_foto: p.ruta_foto || p.url_imagen,
      }));
    } catch (error) {
      console.error('Error al obtener las fotos de la actividad:', error);
      if (error.response?.status === 404) {
        return []; 
      }
      throw new Error('No se pudieron obtener las fotos de la actividad.');
    }
  },

  getActivityReport: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      const idVal = filters?.id_cultivo;
      const hasId = idVal !== undefined && idVal !== null && idVal !== '' && !Number.isNaN(Number(idVal));
      if (hasId) params.append('id_cultivo', String(Number(idVal)));
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

      const queryString = params.toString();
      const url = `${API_URL}/actividades/reporte${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.items || response.data?.data || [];
      return Array.isArray(data) ? data.map(mapActivity) : [];
    } catch (error) {
      console.error('Error al obtener reporte de actividades:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver el reporte');
      }
      throw error;
    }
  }
};

export default activityService;


export const getActivities = async () => {
  const response = await axios.get(`${API_URL}/actividades`, { headers: getAuthHeader() });
  return response.data;
};

export const getActivityById = async (id) => {
  const response = await axios.get(`${API_URL}/actividades/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const createActivity = async (payload) => {
  const response = await axios.post(`${API_URL}/actividades`, payload, { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } });
  return response.data;
};

export const updateActivity = async (id, payload) => {
  const response = await axios.put(`${API_URL}/actividades/${id}`, payload, { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } });
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await axios.delete(`${API_URL}/actividades/${id}`, { headers: getAuthHeader() });
  return response.data;
};
