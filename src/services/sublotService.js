import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getSublotes = async () => {
  const response = await api.get('/sublotes');
  return response.data;
};

export const getSubloteById = async (id) => {
  const response = await api.get(`/sublotes/${id}`);
  return response.data;
};

export const createSublote = async (payload) => {
  const response = await api.post('/sublotes', payload);
  return response.data;
};

export const updateSublote = async (id, payload) => {
  const response = await api.put(`/sublotes/${id}`, payload);
  return response.data;
};

export const deleteSublote = async (id) => {
  const response = await api.delete(`/sublotes/${id}`);
  return response.data;
};

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapSublot = (s) => ({
  id: s.id_sublote,
  descripcion: s.descripcion || '',
  ubicacion: s.ubicacion || '',
  id_lote: s.id_lote?.id_lote || null,
  nombre_lote: s.id_lote?.nombre_lote || '',
  descripcion_lote: s.id_lote?.descripcion || '',
  activo_lote: s.id_lote?.activo || true,
  coordenadas: s.coordenadas || null,
  raw: s
});

const sublotService = {
  getSublots: async () => {
    try {
      const response = await axios.get(`${API_URL}/sublotes`, {
        headers: getAuthHeader()
      });
      return Array.isArray(response.data) ? response.data.map(mapSublot) : [];
    } catch (error) {
      console.error('Error al obtener sublotes:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los sublotes');
      }
      throw error;
    }
  },

  getSublotById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/sublotes/${id}`, {
        headers: getAuthHeader()
      });
      return mapSublot(response.data);
    } catch (error) {
      console.error('Error al obtener el sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver este sublote');
      }
      throw error;
    }
  },

  createSublot: async (sublotData) => {
    try {
      const formattedData = {
        descripcion: sublotData.descripcion.trim(),
        ubicacion: sublotData.ubicacion.trim(),
        id_lote: sublotData.id_lote ? parseInt(sublotData.id_lote, 10) : null,
        ...(Array.isArray(sublotData.coordenadas) ? { coordenadas: sublotData.coordenadas } : {})
      };

      const response = await axios.post(`${API_URL}/sublotes`, formattedData, {
        headers: getAuthHeader()
      });
      return mapSublot(response.data);
    } catch (error) {
      console.error('Error al crear sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para crear sublotes');
      }
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error('Los datos del sublote no son válidos');
      }
      throw error;
    }
  },

  updateSublot: async (id, sublotData) => {
    try {
      const formattedData = {
        descripcion: sublotData.descripcion.trim(),
        ubicacion: sublotData.ubicacion.trim(),
        id_lote: sublotData.id_lote ? parseInt(sublotData.id_lote, 10) : null,
        ...(Array.isArray(sublotData.coordenadas) ? { coordenadas: sublotData.coordenadas } : {})
      };

      const response = await axios.patch(`${API_URL}/sublotes/${id}`, formattedData, {
        headers: getAuthHeader()
      });
      return mapSublot(response.data);
    } catch (error) {
      console.error('Error al actualizar sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para actualizar sublotes');
      }
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          throw new Error(errorMessages.join(', '));
        }
        throw new Error('Los datos del sublote no son válidos');
      }
      throw error;
    }
  },

  deleteSublot: async (id) => {
    try {
      await axios.delete(`${API_URL}/sublotes/${id}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error('Error al eliminar sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar sublotes');
      }
      throw error;
    }
  },

  getSublotSensors: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/sublotes/${id}/sensores`, {
        headers: getAuthHeader()
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error al obtener sensores del sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los sensores de este sublote');
      }
      throw error;
    }
  },

  getSublotStatistics: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/sublotes/${id}/estadisticas`, {
        headers: getAuthHeader()
      });
      return response.data || {};
    } catch (error) {
      console.error('Error al obtener estadísticas del sublote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver las estadísticas de este sublote');
      }
      return {
        total_sensores: 0,
        sensores_activos: 0,
        sensores_inactivos: 0,
        tipos_sensores: 0,
        ultima_actividad: null
      };
    }
  }
};

export default sublotService;
