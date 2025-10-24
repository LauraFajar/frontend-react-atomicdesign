import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const inferTipoTratamiento = (descripcion = '') => {
  const desc = descripcion.toLowerCase();
  const biologicoKeywords = [
    'biológico', 'biologico', 'orgánico', 'organico', 'natural', 
    'bacillus', 'trichoderma', 'micorrizas', 'micorriza', 'bacteria', 
    'hongo', 'hongos', 'microorganismo', 'microorganismos', 'extracto',
    'neem', 'compost', 'té', 'te de', 'fermentado'
  ];
  
  for (const keyword of biologicoKeywords) {
    if (desc.includes(keyword)) {
      return 'biologico';
    }
  }
  
  return 'quimico';
};

const mapTratamiento = (t) => {
  const epaField = t.id_epa;
  const epaObj = epaField && typeof epaField === 'object' ? epaField : null;
  const epaId = epaObj ? (epaObj.id_epa ?? epaObj.id ?? null) : epaField;
  const epaName = epaObj ? (epaObj.nombre_epa ?? epaObj.nombre ?? '') : '';
  
  const tipo = t.tipo || inferTipoTratamiento(t.descripcion);

  return {
    id: t.id_tratamiento || t.id,
    descripcion: t.descripcion,
    dosis: t.dosis,
    frecuencia: t.frecuencia,
    id_epa: epaId,
    epa_nombre: epaName,
    tipo: tipo,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    raw: t
  };
};

const tratamientoService = {
  createTratamiento: async (data) => {
    const payload = {
      descripcion: data.descripcion,
      dosis: data.dosis,
      frecuencia: data.frecuencia,
      id_epa: Number(data.id_epa),
      tipo: data.tipo || inferTipoTratamiento(data.descripcion)
    };
    const response = await axios.post(`${API_URL}/tratamientos`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return mapTratamiento(response.data);
  },

  getTratamientos: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.epaId) params.append('epaId', filters.epaId);
    if (filters.tipo) params.append('tipo', filters.tipo);
    const url = `${API_URL}/tratamientos${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get(url, {
      headers: getAuthHeader()
    });
    const data = response.data;
    return Array.isArray(data) ? data.map(mapTratamiento) : data;
  },

  getTratamientoById: async (id) => {
    const response = await axios.get(`${API_URL}/tratamientos/${id}`, {
      headers: getAuthHeader()
    });
    return mapTratamiento(response.data);
  },

  updateTratamiento: async (id, data) => {
    const payload = {
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.dosis !== undefined ? { dosis: data.dosis } : {}),
      ...(data.frecuencia !== undefined ? { frecuencia: data.frecuencia } : {}),
      ...(data.id_epa !== undefined ? { id_epa: Number(data.id_epa) } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {})
    };
    const response = await axios.patch(`${API_URL}/tratamientos/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return mapTratamiento(response.data);
  },

  deleteTratamiento: async (id) => {
    const response = await axios.delete(`${API_URL}/tratamientos/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default tratamientoService;