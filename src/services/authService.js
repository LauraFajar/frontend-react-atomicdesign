import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // false temporalmente para pruebas
});

api.interceptors.request.use(
  config => {
    console.log('Enviando solicitud a:', config.url);
    return config;
  },
  error => {
    console.error('Error en la solicitud:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('Respuesta recibida:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('Error en la respuesta:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

const authService = {
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error en requestPasswordReset:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.message || 
                         (error.response?.status === 500 ? 'Error en el servidor' : 
                         'Error al solicitar el restablecimiento de contraseña');
      
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Error en resetPassword:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.message || 
                         (error.response?.status === 500 ? 'Error en el servidor' : 
                         'Error al restablecer la contraseña');
      
      throw new Error(errorMessage);
    }
  }
};

export default authService;
