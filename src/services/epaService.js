import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
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
  getEpas: async () => {
    const response = await axios.get(`${API_URL}/epa`, {
      headers: getAuthHeader()
    });
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
    const response = await axios.post(`${API_URL}/epa`, epaData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return mapEpa(response.data);
  },

  updateEpa: async (id, epaData) => {
    const response = await axios.patch(`${API_URL}/epa/${id}`, epaData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return mapEpa(response.data);
  },

  deleteEpa: async (id) => {
    const response = await axios.delete(`${API_URL}/epa/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default epaService;