import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const reportesService = {
  getHello: async () => {
    const response = await axios.get(`${API_URL}/reportes`, { headers: getAuthHeader() });
    const data = response.data;
    if (typeof data === 'string') return data;
    return data?.message || 'Hola Mundo Reportes';
  }
};

export default reportesService;