import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const getAuthHeader = () => {
  const token = Cookies.get('token');
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
      return 'Biologico';
    }
  }
  
  return 'Quimico';
};

const mapTratamiento = (t) => {
  if (!t) return null;
  
  console.log('Datos crudos del backend:', t);
  console.log('tratamientoInsumos:', t.tratamientoInsumos);
  
  const epaField = t.id_epa;
  const epaObj = epaField && typeof epaField === 'object' ? epaField : null;
  const epaId = epaObj ? (epaObj.id_epa ?? epaObj.id ?? null) : epaField;
  const epaName = epaObj ? (epaObj.nombre_epa ?? epaObj.nombre ?? '') : '';
  
  const tipoRaw = t.tipo || inferTipoTratamiento(t.descripcion);
  const tipo = String(tipoRaw).toLowerCase() === 'biologico' ? 'biologico' : 'quimico';

  const insumos = t.tratamientoInsumos ? t.tratamientoInsumos.map(ti => ({
    id_tratamiento_insumo: ti.id_tratamiento_insumo,
    id_insumo: ti.id_insumos?.id_insumo || ti.id_insumo,
    nombre_insumo: ti.id_insumos?.nombre_insumo || '',
    cantidad_usada: ti.cantidad_usada,
    unidad_medida: ti.unidad_medida || 'unidades'
  })) : [];

  console.log('Insumos mapeados:', insumos);

  return {
    id: t.id_tratamiento || t.id,
    descripcion: t.descripcion || '',
    dosis: t.dosis || '',
    frecuencia: t.frecuencia || '',
    id_epa: epaId,
    epa_nombre: epaName,
    tipo: tipo,
    insumos: insumos,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    raw: t
  };
};

const tratamientoService = {
  createTratamiento: async (data) => {
    const idEpaNum = Number(data.id_epa);
    const tipoRaw = data.tipo || inferTipoTratamiento(data.descripcion);
    const tipoFormateado = tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1).toLowerCase();
    
    const payload = {
      descripcion: data.descripcion,
      dosis: data.dosis,
      frecuencia: data.frecuencia,
      id_epa: idEpaNum,
      tipo: tipoFormateado,
      insumos: data.insumos || []
    };
    
    try {
      const response = await axios.post(`${API_URL}/tratamientos`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      console.log('DEBUG: Tratamiento creado exitosamente:', response.data);

      if (data.insumos && data.insumos.length > 0) {
        console.log('DEBUG: Creando movimientos para insumos:', data.insumos);
        for (const insumo of data.insumos) {
          if (insumo.id_insumo && insumo.cantidad_usada) {
            console.log('DEBUG: Creando movimiento para insumo:', insumo);
            try {
              await axios.post(`${API_URL}/movimientos`, {
                tipo_movimiento: 'Salida',
                id_insumo: insumo.id_insumo,
                cantidad: Number(insumo.cantidad_usada),
                unidad_medida: insumo.unidad_medida || 'unidades',
                fecha_movimiento: new Date().toISOString().slice(0, 10),
                motivo: `Usado en tratamiento: ${data.descripcion}`,
                id_epa: idEpaNum
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeader()
                }
              });
              console.log('DEBUG: Movimiento creado exitosamente');
            } catch (movError) {
              console.error('DEBUG: Error al crear movimiento:', movError.response?.data || movError.message);
              
            }
          }
        }
      }

      return mapTratamiento(response.data);
    } catch (error) {
      console.error('DEBUG: Error creating tratamiento:', error.response?.data || error.message);
      throw error;
    }
  },

  getTratamientos: async (filters = {}) => {
    console.log('getTratamientos llamado con filtros:', filters);
    const params = new URLSearchParams();
    if (filters.epaId) params.append('epaId', filters.epaId);
    if (filters.tipo) params.append('tipo', filters.tipo);
    const url = `${API_URL}/tratamientos${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('URL completa:', url);
    
    const response = await axios.get(url, {
      headers: getAuthHeader()
    });
    
    console.log('Respuesta cruda del backend:', response.data);
    
    const data = response.data;
    const mapped = Array.isArray(data) ? data.map(mapTratamiento) : data;
    const result = Array.isArray(mapped) ? mapped.filter(item => item !== null) : mapped;
    
    console.log('Resultado final mapeado:', result);
    
    return result;
  },

  getTratamientoById: async (id) => {
    const response = await axios.get(`${API_URL}/tratamientos/${id}`, {
      headers: getAuthHeader()
    });
    return mapTratamiento(response.data);
  },

  updateTratamiento: async (id, data) => {
    console.log('DEBUG: tratamientoService.updateTratamiento llamado con:', { id, data });
    
    const payload = {
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.dosis !== undefined ? { dosis: data.dosis } : {}),
      ...(data.frecuencia !== undefined ? { frecuencia: data.frecuencia } : {}),
      ...(data.id_epa !== undefined && data.id_epa !== '' ? { id_epa: Number(data.id_epa) } : {}),
      ...(data.tipo !== undefined ? { 
        tipo: data.tipo.charAt(0).toUpperCase() + data.tipo.slice(1).toLowerCase() 
      } : {})
    };
    
    console.log('DEBUG: Payload a enviar:', payload);
    console.log('DEBUG: URL completa:', `${API_URL}/tratamientos/${id}`);
    
    try {
      const response = await axios.patch(`${API_URL}/tratamientos/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      console.log('DEBUG: Respuesta exitosa:', response.data);
      return mapTratamiento(response.data);
    } catch (error) {
      console.error('DEBUG: Error en updateTratamiento:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteTratamiento: async (id) => {
    const response = await axios.delete(`${API_URL}/tratamientos/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default tratamientoService;