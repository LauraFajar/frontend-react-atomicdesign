import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapUser = (u) => {
  let idRol = u.id_rol;
  let nombreRol = '';

  if (idRol && typeof idRol === 'object') {
    nombreRol = idRol.nombre_rol || '';
    idRol = idRol.id_rol || idRol;
    console.log('[mapUser] Object id_rol:', u.id_rol, '-> id:', idRol, 'nombre:', nombreRol);
  }

  const mappedUser = {
    id: u.id_usuarios || u.id_usuario || u.id,
    nombres: u.nombres,
    email: u.email,
    tipo_documento: u.tipo_documento,
    numero_documento: u.numero_documento,
    id_rol: idRol,
    nombre_rol: nombreRol || u.nombre_rol || '',
    imagen_url: u.imagen_url || '',
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    raw: u
  };

  console.log('[mapUser] Input user:', u);
  console.log('[mapUser] Mapped user:', {
    id: mappedUser.id,
    nombres: mappedUser.nombres,
    id_rol: mappedUser.id_rol,
    nombre_rol: mappedUser.nombre_rol
  });

  return mappedUser;
};

const userService = {
  getUsers: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`, {
        headers: getAuthHeader(),
        params: { page, limit },
      });

      console.log('[userService] GET /usuarios response:', response.data);

      if (response.data && Array.isArray(response.data.data)) {
        return {
          items: response.data.data.map(mapUser),
          meta: {
            totalItems: response.data.total,
            currentPage: response.data.page,
            totalPages: Math.ceil(response.data.total / response.data.limit),
          },
        };
      }

      if (response.data && Array.isArray(response.data.items)) {
        return {
          items: response.data.items.map(mapUser),
          meta: response.data.meta,
        };
      }

      if (Array.isArray(response.data)) {
        return {
          items: response.data.map(mapUser),
          meta: { totalItems: response.data.length, totalPages: 1, currentPage: 1 },
        };
      }

      return { items: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1 } };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los usuarios');
      }
      throw error;
    }
  },

  getUsersBasic: async (page = 1, limit = 100) => {
    try {
      const response = await axios.get(`${API_URL}/usuarios/basico`, {
        headers: getAuthHeader(),
        params: { page, limit },
      });
      if (response.data && Array.isArray(response.data.items)) {
        return {
          items: response.data.items.map(mapUser),
          meta: response.data.meta,
        };
      }
      const arr = Array.isArray(response.data) ? response.data : [];
      return { items: arr.map(mapUser), meta: { totalItems: arr.length, totalPages: 1, currentPage: 1 } };
    } catch (error) {
      console.error('Error al obtener usuarios básicos:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver los usuarios');
      }
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/usuarios/${id}`, {
        headers: getAuthHeader()
      });
      return mapUser(response.data);
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para ver este usuario');
      }
      throw error;
    }
  },

  createUser: async (userData) => {
    try {

      const payload = {
        nombres: userData.nombres,
        email: userData.email,
        tipo_documento: userData.tipo_documento,
        numero_documento: userData.numero_documento,
        id_rol: userData.id_rol,
        password: userData.password
      };

      console.log('[userService] POST /usuarios final payload:', payload);

      const response = await axios.post(`${API_URL}/usuarios`, payload, {
        headers: getAuthHeader()
      });

      console.log('[userService] Create user response:', response.data);
      return mapUser(response.data);
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para crear usuarios');
        }
      }
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      console.log('[userService] PATCH /usuarios/' + id + ' payload:', userData);

      if (userData instanceof FormData) {
        const response = await axios.patch(`${API_URL}/usuarios/${id}`, userData, {
          headers: {
            ...getAuthHeader(),
          }
        })
        console.log('[userService] Update user (FormData) response:', response.data)
        return mapUser(response.data)
      }
      const payload = {
        nombres: userData.nombres,
        email: userData.email,
        tipo_documento: userData.tipo_documento,
        numero_documento: userData.numero_documento,
        id_rol: userData.id_rol,
        imagen_url: userData.imagen_url
      }

      if (userData.password && userData.password.trim()) {
        payload.password = userData.password
      }

      console.log('[userService] PATCH /usuarios/' + id + ' final payload:', payload)

      const response = await axios.patch(`${API_URL}/usuarios/${id}`, payload, {
        headers: getAuthHeader()
      })

      console.log('[userService] Update user response:', response.data)
      return mapUser(response.data)
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        if (error.response.status === 403) {
          throw new Error('No tienes permisos para actualizar este usuario');
        }
      }
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const userId = String(id).trim();
      console.log('[userService] DELETE /usuarios/' + userId + ' request');
      console.log('[userService] Headers:', getAuthHeader());
      console.log('[userService] Full URL:', `${API_URL}/usuarios/${userId}`);
      console.log('[userService] Original ID:', id, 'Converted ID:', userId);

      const response = await axios.delete(`${API_URL}/usuarios/${userId}`, {
        headers: getAuthHeader()
      });

      console.log('[userService] DELETE response:', response.data);
      console.log('[userService] DELETE status:', response.status);
      return response.data;
    } catch (error) {
      console.error('=== DELETE USER ERROR DEBUG ===');
      console.error('Error object:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error code:', error.code);
      console.error('Error config:', error.config);
      console.error('=== END DEBUG ===');

      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar usuarios');
      }
      if (error.response?.status === 404) {
        throw new Error(`El usuario con ID ${id} no fue encontrado`);
      }
      if (error.response?.status >= 500) {
        console.error('Server error details:', error.response?.data);
        throw new Error('Error del servidor al eliminar el usuario');
      }

      if (!error.response) {
        console.error('No response received from server');
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          throw new Error('Error de conexión de red. Verifica tu conexión a internet.');
        }
        if (error.message?.includes('CORS')) {
          throw new Error('Error de CORS. El servidor no permite la conexión desde este origen.');
        }
        throw new Error('No se pudo conectar con el servidor. Verifica que el servidor esté corriendo.');
      }

      throw error;
    }
  },

  uploadUserImage: async (userId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('imagen', imageFile);

      console.log('[userService] POST /usuarios/' + userId + '/upload-imagen request');

      const response = await axios.post(`${API_URL}/usuarios/${userId}/upload-imagen`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('[userService] Upload image response:', response.data);
      return mapUser(response.data);
    } catch (error) {
      console.error('Error al subir imagen del usuario:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para subir imágenes de este usuario');
      }
      if (error.response?.status === 413) {
        throw new Error('La imagen es demasiado grande. Por favor selecciona una imagen más pequeña.');
      }
      throw error;
    }
  },

  getRoles: async () => {
    try {
      console.log('[userService] GET /rol request');
      const response = await axios.get(`${API_URL}/rol`, {
        headers: getAuthHeader()
      });
      console.log('[userService] GET /rol response:', response.data);
      console.log('[userService] Response type:', typeof response.data);
      console.log('[userService] Is array:', Array.isArray(response.data));

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((role, index) => {
          console.log(`[userService] Role ${index}:`, role, 'Type:', typeof role);
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      console.warn('Endpoint /rol falló, continuando sin información de roles');
      return [];
    }
  }
};

export default userService;
