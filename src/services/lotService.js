import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapLot = (l) => ({
  id: l.id_lote || l.id,
  nombre: l.nombre_lote || l.nombre || '',
  descripcion: l.descripcion || '',
  activo: l.activo !== undefined ? l.activo : true,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
  raw: l
})

const lotService = {
  getLots: async () => {
    try {
      const response = await axios.get(`${API_URL}/lotes`, {
        headers: getAuthHeader()
      });
      return Array.isArray(response.data) ? response.data.map(mapLot) : [];
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los lotes');
      }
      throw error;
    }
  },

  getLotById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/lotes/${id}`, {
        headers: getAuthHeader()
      });
      return mapLot(response.data);
    } catch (error) {
      console.error('Error al obtener el lote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver este lote');
      }
      throw error;
    }
  },

  createLot: async (lotData) => {
    try {
      console.log('[lotService] Datos recibidos para crear:', lotData);

      const { nombre_lote, descripcion, activo } = lotData;
      const filteredData = {
        nombre_lote: String(nombre_lote),
        descripcion: String(descripcion),
        activo: Boolean(activo !== undefined ? activo : true)
      };

      console.log('[lotService] Datos filtrados para envío:', filteredData);

      const response = await axios.post(`${API_URL}/lotes`, filteredData, {
        headers: getAuthHeader()
      });
      return mapLot(response.data);
    } catch (error) {
      console.error('Error al crear el lote:', error);
      if (error.response) {
        console.error('Server response status:', error.response.status);
        console.error('Server response data:', error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para crear lotes');
        }
      }
      throw error;
    }
  },

  updateLot: async (id, lotData) => {
    try {
      console.log('[lotService] Datos recibidos para actualizar:', lotData);

      const updateData = {};

      if (lotData.nombre_lote !== undefined) {
        updateData.nombre_lote = lotData.nombre_lote;
      }
      if (lotData.descripcion !== undefined) {
        updateData.descripcion = lotData.descripcion;
      }

      if ('activo' in lotData) {
        updateData.activo = Boolean(lotData.activo);
        console.log('[lotService] Incluyendo campo activo en actualización:', lotData.activo);
      } else {
        console.log('[lotService] Campo activo no presente en datos recibidos');
      }

      console.log('[lotService] Datos finales para PATCH:', updateData);

      const response = await axios.patch(`${API_URL}/lotes/${id}`, updateData, {
        headers: getAuthHeader()
      });
      return mapLot(response.data);
    } catch (error) {
      console.error('Error al actualizar el lote:', error);
      if (error.response) {
        console.error('Server response status:', error.response.status);
        console.error('Server response data:', error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para actualizar este lote');
        }
      }
      throw error;
    }
  },

  updateCoordinates: async (id, ringCoordinates) => {
    try {
      const body1 = { coordenadas: [ringCoordinates] };
      try {
        const r1 = await axios.patch(`${API_URL}/lotes/${id}`, body1, { headers: getAuthHeader() });
        return r1.data;
      } catch (e1) {
        try {
          const r2 = await axios.post(`${API_URL}/lotes/${id}/coordenadas`, { coordinates: [ringCoordinates] }, { headers: getAuthHeader() });
          return r2.data;
        } catch (e2) {
          const r3 = await axios.put(`${API_URL}/lotes/${id}/coordenadas`, { coordinates: [ringCoordinates] }, { headers: getAuthHeader() });
          return r3.data;
        }
      }
    } catch (error) {
      console.error('Error al actualizar coordenadas del lote:', error);
      throw error;
    }
  },

  deleteLot: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/lotes/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar el lote:', error);
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar lotes');
      }
      throw error;
    }
  },

  clearCoordinates: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/lotes/${id}`, { coordenadas: [] }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al limpiar coordenadas del lote:', error);
      throw error;
    }
  },

  getMapData: async () => {
    try {
      const response = await axios.get(`${API_URL}/lotes/map-data`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener los datos del mapa:', error);
      throw error;
    }
  }
};

export default lotService;
