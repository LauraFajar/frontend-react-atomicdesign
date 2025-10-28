import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapActivity = (a) => ({
  id: a.id_actividad || a.id,
  tipo_actividad: a.tipo_actividad,
  fecha: a.fecha,
  responsable: a.responsable,
  detalles: a.detalles,
  estado: a.estado,
  id_cultivo: a.id_cultivo,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  raw: a
});

const activityService = {
  getActivities: async (filters = {}, page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (filters.id_cultivo) params.append('id_cultivo', filters.id_cultivo);
      params.append('page', page);
      params.append('limit', limit);

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
      return mapActivity(response.data);
    } catch (error) {
      console.error('Error al obtener la actividad:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver esta actividad');
      }
      throw error;
    }
  },

  createActivity: async (activityData) => {
    try {
      console.log('[activityService] POST /actividades payload:', activityData);
      const response = await axios.post(`${API_URL}/actividades`, activityData, {
        headers: getAuthHeader()
      });
      return mapActivity(response.data);
    } catch (error) {
      console.error('Error al crear la actividad:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para crear actividades');
        }
      }
      throw error;
    }
  },

  updateActivity: async (id, activityData) => {
    try {
      console.log('[activityService] PATCH /actividades/' + id + ' payload:', activityData);
      const response = await axios.patch(`${API_URL}/actividades/${id}`, activityData, {
        headers: getAuthHeader()
      });
      return mapActivity(response.data);
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para actualizar esta actividad');
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

  getActivityReport: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.id_cultivo) params.append('id_cultivo', filters.id_cultivo);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

      const queryString = params.toString();
      const url = `${API_URL}/actividades/reporte${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      return response.data;
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
