import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapCrop = (c) => ({
  id: c.id_cultivo || c.id,
  tipo_cultivo: c.tipo_cultivo,
  fecha_siembra: c.fecha_siembra,
  fecha_cosecha_estimada: c.fecha_cosecha_estimada,
  fecha_cosecha_real: c.fecha_cosecha_real,
  estado_cultivo: c.estado_cultivo,
  observaciones: c.observaciones,
  id_lote: c.id_lote,
  id_insumo: c.id_insumo,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  raw: c
})

const cropService = {
  getCrops: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/cultivos`, {
        params: { page, limit },
        headers: getAuthHeader()
      });

      if (response.data && response.data.items) {
        return {
          items: response.data.items.map(mapCrop),
          meta: response.data.meta
        };
      }
      
      const data = Array.isArray(response.data) ? response.data.map(mapCrop) : response.data;
      return {
        items: data,
        meta: { totalPages: 1, currentPage: 1 }
      };

    } catch (error) {
      console.error('Error al obtener cultivos:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los cultivos');
      }
      throw error;
    }
  },

  getCropById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/cultivos/${id}`, {
        headers: getAuthHeader()
      });
      return mapCrop(response.data);
    } catch (error) {
      console.error('Error al obtener el cultivo:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver este cultivo');
      }
      throw error;
    }
  },

  createCrop: async (cropData) => {
    try {
      console.log('[cropService] POST /cultivos payload:', cropData)
      const response = await axios.post(`${API_URL}/cultivos`, cropData, {
        headers: getAuthHeader()
      });
      return mapCrop(response.data);
    } catch (error) {
      console.error('Error al crear el cultivo:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data)
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para crear cultivos');
        }
      }
      throw error;
    }
  },

  updateCrop: async (id, cropData) => {
    try {
      console.log('[cropService] PATCH /cultivos/' + id + ' payload:', cropData)
      const response = await axios.patch(`${API_URL}/cultivos/${id}`, cropData, {
        headers: getAuthHeader()
      });
      return mapCrop(response.data);
    } catch (error) {
      console.error('Error al actualizar el cultivo:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data)
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para actualizar este cultivo');
        }
      }
      throw error;
    }
  },

  deleteCrop: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/cultivos/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar el cultivo:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar cultivos');
      }
      if (error.response?.status === 404) {
        throw new Error(`El cultivo con ID ${id} no fue encontrado`);
      }
      if (error.response?.status >= 500) {
        throw new Error('Error del servidor al eliminar el cultivo');
      }
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        throw new Error('Error de conexión de red');
      }
      throw error;
    }
  },

  getCropStatistics: async () => {
    try {
      const response = await axios.get(`${API_URL}/cultivos/estadisticas`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver las estadísticas');
      }
      throw error;
    }
  }
};

export default cropService;
