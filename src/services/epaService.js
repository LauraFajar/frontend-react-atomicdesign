import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapEpa = (e) => ({
  id: e.id_epa || e.id,
  nombre: e.nombre_epa || e.nombre || e.name,
  descripcion: e.descripcion,
  tipo: e.tipo,
  estado: e.estado,
  raw: e
});

const epaService = {
  getEpas: async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_URL}/epa`, {
      params: { page, limit },
      headers: getAuthHeader()
    });
    if (response.data && response.data.items) {
      return {
        items: response.data.items.map(mapEpa),
        meta: response.data.meta
      };
    }
    const data = response.data;
    return Array.isArray(data) ? data.map(mapEpa) : data;
  },

  getEpaById: async (id) => {
    const response = await axios.get(`${API_URL}/epa/${id}`, {
      headers: getAuthHeader()
    });
    return mapEpa(response.data);
  },

  createEpa: async (epaData) => {
    const payload = {
      nombre_epa: epaData.nombre_epa,
      descripcion: epaData.descripcion,
      tipo: epaData.tipo,
      estado: epaData.estado || 'activo'
    };
    
    console.log('Datos enviados al backend:', payload);
    
    try {
      const response = await axios.post(`${API_URL}/epa`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return mapEpa(response.data);
    } catch (error) {
      console.error('Error detallado:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Respuesta del servidor:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  updateEpa: async (id, epaData) => {
    const payload = {
      nombre_epa: epaData.nombre_epa || epaData.nombre,
      descripcion: epaData.descripcion,
      tipo: epaData.tipo,
      estado: epaData.estado
    };
    
    console.log('Datos enviados al actualizar EPA:', payload);
    
    try {
      const response = await axios.patch(`${API_URL}/epa/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return mapEpa(response.data);
    } catch (error) {
      console.error('Error al actualizar EPA:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Respuesta del servidor:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  deleteEpa: async (id) => {
    const response = await axios.delete(`${API_URL}/epa/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default epaService;