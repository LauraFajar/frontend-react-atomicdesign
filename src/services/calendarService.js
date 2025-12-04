import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_BASE_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class CalendarService {
  /**
   * @param {string} fechaDesde 
   * @param {string} fechaHasta 
   * @returns {Promise<Array>} */
  async getCalendarEvents(fechaDesde, fechaHasta) {
    try {
      const cultivosResponse = await axios.get(
        `${API_BASE_URL}/cultivos/calendario`,
        {
          params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
          headers: getAuthHeader()
        }
      );

      const actividadesResponse = await axios.get(
        `${API_BASE_URL}/actividades/reporte`,
        {
          params: {
            fecha_inicio: fechaDesde,
            fecha_fin: fechaHasta
          },
          headers: getAuthHeader()
        }
      );

      const eventosCultivos = cultivosResponse.data.map(evento => ({
        id: `cultivo-${evento.id}`,
        titulo: `${evento.estado} - ${evento.tipo_cultivo}`,
        fecha: evento.fecha,
        tipo: evento.estado === 'sembrado' ? 'siembra' : 'cosecha',
        id_cultivo: evento.id_cultivo,
        descripcion: `Evento de ${evento.estado} para el cultivo ${evento.tipo_cultivo}`,
        estado: evento.estado,
        tipo_cultivo: evento.tipo_cultivo
      }));

      const eventosActividades = actividadesResponse.data.map(evento => ({
        id: `actividad-${evento.id}`,
        titulo: evento.tipo_actividad,
        fecha: evento.fecha,
        tipo: 'actividad',
        id_cultivo: evento.id_cultivo,
        descripcion: evento.detalles,
        estado: evento.estado,
        responsable: evento.responsable,
        tipo_actividad: evento.tipo_actividad
      }));

      return [...eventosCultivos, ...eventosActividades];
    } catch (error) {
      console.error('Error obteniendo eventos del calendario:', error);
      throw new Error(
        error.response?.data?.message ||
        'Error al obtener los eventos del calendario'
      );
    }
  }

  /**
   * Obtiene eventos de cultivos únicamente
   * @param {string} fechaDesde - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaHasta - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Array de eventos de cultivos
   */
  async getCultivosEvents(fechaDesde, fechaHasta) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/cultivos/calendario`,
        {
          params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
          headers: getAuthHeader()
        }
      );

      return response.data.map(evento => ({
        id: `cultivo-${evento.id}`,
        titulo: `${evento.estado} - ${evento.tipo_cultivo}`,
        fecha: evento.fecha,
        tipo: evento.estado === 'sembrado' ? 'siembra' : 'cosecha',
        id_cultivo: evento.id_cultivo,
        descripcion: `Evento de ${evento.estado} para el cultivo ${evento.tipo_cultivo}`,
        estado: evento.estado,
        tipo_cultivo: evento.tipo_cultivo
      }));
    } catch (error) {
      console.error('Error obteniendo eventos de cultivos:', error);
      throw new Error(
        error.response?.data?.message ||
        'Error al obtener los eventos de cultivos'
      );
    }
  }

  /**
   * Obtiene eventos de actividades únicamente
   * @param {string} fechaDesde - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaHasta - Fecha de fin (YYYY-MM-DD)
   * @param {number} idCultivo - ID del cultivo (opcional)
   * @returns {Promise<Array>} Array de eventos de actividades
   */
  async getActividadesEvents(fechaDesde, fechaHasta, idCultivo = null) {
    try {
      const params = {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta
      };

      if (idCultivo) {
        params.id_cultivo = idCultivo;
      }

      const response = await axios.get(
        `${API_BASE_URL}/actividades/reporte`,
        { params, headers: getAuthHeader() }
      );

      return response.data.map(evento => ({
        id: `actividad-${evento.id}`,
        titulo: evento.tipo_actividad,
        fecha: evento.fecha,
        tipo: 'actividad',
        id_cultivo: evento.id_cultivo,
        descripcion: evento.detalles,
        estado: evento.estado,
        responsable: evento.responsable,
        tipo_actividad: evento.tipo_actividad
      }));
    } catch (error) {
      console.error('Error obteniendo eventos de actividades:', error);
      throw new Error(
        error.response?.data?.message ||
        'Error al obtener los eventos de actividades'
      );
    }
  }

  /**
   * @param {string} eventId 
   * @returns {Promise<Object>} 
   */
  async getEventDetails(eventId) {
    try {
      const isCultivoEvent = eventId.startsWith('cultivo-');
      const isActividadEvent = eventId.startsWith('actividad-');

      if (isCultivoEvent) {
        const cultivoId = eventId.replace('cultivo-', '');
        const response = await axios.get(`${API_BASE_URL}/cultivos/${cultivoId}`, { headers: getAuthHeader() });
        return response.data;
      } else if (isActividadEvent) {
        const actividadId = eventId.replace('actividad-', '');
        const response = await axios.get(`${API_BASE_URL}/actividades/${actividadId}`, { headers: getAuthHeader() });
        return response.data;
      } else {
        throw new Error('Tipo de evento no reconocido');
      }
    } catch (error) {
      console.error('Error obteniendo detalles del evento:', error);
      throw new Error(
        error.response?.data?.message ||
        'Error al obtener los detalles del evento'
      );
    }
  }
}

const calendarService = new CalendarService();
export default calendarService;

// Eliminado bloque duplicado de axios CRUD; mantener CalendarService como export default
