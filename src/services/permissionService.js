import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';

const API_URL = config.api.baseURL;

// Asegurar envío de cookies (sesión) para endpoints protegidos
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const getAuthHeader = () => {
  const token = Cookies.get('token');
  if (token) return { Authorization: `Bearer ${token}` };
  const defaultAuth = axios.defaults.headers.common['Authorization'];
  return defaultAuth ? { Authorization: defaultAuth } : {};
};

let _cachedAllPerms = null;

const permissionService = {
  list: async () => {
    const response = await api.get(`/permisos`, { headers: getAuthHeader() });
    const data = response.data;
    const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
    _cachedAllPerms = arr;
    return arr;
  },

  create: async ({ recurso, accion, nombre_permiso, descripcion, activo = true }) => {
    const normalizeAction = (a) => {
      const lower = (a || '').toString().trim().toLowerCase();
      const map = {
        read: 'ver', view: 'ver', list: 'ver', listar: 'ver', ver: 'ver',
        create: 'crear', add: 'crear', new: 'crear', crear: 'crear',
        update: 'editar', edit: 'editar', modificar: 'editar', editar: 'editar',
        delete: 'eliminar', remove: 'eliminar', borrar: 'eliminar', eliminar: 'eliminar',
        export: 'exportar', download: 'exportar', exportar: 'exportar'
      };
      return map[lower] || lower;
    };
    const normAccion = normalizeAction(accion);
    const clave = `${(recurso || '').toString().trim()}:${normAccion}`;
    const payload = { clave, recurso, accion: normAccion, nombre_permiso, descripcion, activo };
    const response = await api.post(`/permisos`, payload, { headers: getAuthHeader() });
    return response.data;
  },

  getUserKeys: async (idUsuario) => {
    const response = await api.get(`/permisos/usuario/${idUsuario}`, { headers: getAuthHeader() });
    const data = response.data;
    const normalizeKey = (k) => {
      const s = (k || '').toString().trim().toLowerCase();
      if (!s) return '';
      let n = s.replace(/[._]/g, ':');
      n = n.replace(/:+/g, ':');
      n = n.replace(/:\*+/g, ':*');
      n = n.endsWith(':') ? n.slice(0, -1) : n;
      return n;
    };

    const arr = Array.isArray(data) ? data
      : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.data) ? data.data
      : [];

    if (!_cachedAllPerms) {
      try {
        _cachedAllPerms = await permissionService.list();
      } catch (e) {
        console.warn('[permissionService.getUserKeys] Failed to cache permissions:', e);
      }
    }

    const toKey = (p) => {
      if (!p) return null;
      if (typeof p === 'string') {
        const s = p.toString().trim();
        const m = s.match(/permiso:?\s*([0-9]+)/i);
        if (m && _cachedAllPerms) {
          const id = Number(m[1]);
          const found = _cachedAllPerms.find(x => Number(x.id_permiso) === id || Number(x.id) === id);
          if (found && (found.recurso || found.accion)) {
            return normalizeKey(`${found.recurso || ''}:${found.accion || ''}`);
          }
        }
        return normalizeKey(s);
      }
      if (p.clave && typeof p.clave === 'string') return normalizeKey(p.clave);
      if (p.recurso && p.accion) return normalizeKey(`${p.recurso}:${p.accion}`);
      if (p.id_permiso && _cachedAllPerms) {
        const found = _cachedAllPerms.find(x => Number(x.id_permiso) === Number(p.id_permiso) || Number(x.id) === Number(p.id_permiso));
        if (found) return normalizeKey(`${found.recurso || ''}:${found.accion || ''}`);
      }
      return null;
    };

    const keys = arr.map(toKey).filter(Boolean);
    console.log('[permissionService] user keys loaded:', keys);
    return keys;
  },

  getMyKeys: async () => {
    const response = await api.get(`/permisos/usuario/me`, { headers: getAuthHeader() });
    const data = response.data;
    const normalizeKey = (k) => {
      const s = (k || '').toString().trim().toLowerCase();
      if (!s) return '';
      let n = s.replace(/[._]/g, ':');
      n = n.replace(/:+/g, ':');
      n = n.replace(/:\*+/g, ':*');
      n = n.endsWith(':') ? n.slice(0, -1) : n;
      return n;
    };

    const arr = Array.isArray(data) ? data
      : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.data) ? data.data
      : [];

    if (!_cachedAllPerms) {
      try {
        _cachedAllPerms = await permissionService.list();
      } catch (e) {
        console.warn('[permissionService.getMyKeys] Failed to cache permissions:', e);
      }
    }

    const toKey = (p) => {
      if (!p) return null;
      if (typeof p === 'string') {
        const s = p.toString().trim();
        const m = s.match(/permiso:?\s*([0-9]+)/i);
        if (m && _cachedAllPerms) {
          const id = Number(m[1]);
          const found = _cachedAllPerms.find(x => Number(x.id_permiso) === id || Number(x.id) === id);
          if (found && (found.recurso || found.accion)) {
            return normalizeKey(`${found.recurso || ''}:${found.accion || ''}`);
          }
        }
        return normalizeKey(s);
      }
      if (p.clave && typeof p.clave === 'string') return normalizeKey(p.clave);
      if (p.recurso && p.accion) return normalizeKey(`${p.recurso}:${p.accion}`);
      if (p.id_permiso && _cachedAllPerms) {
        const found = _cachedAllPerms.find(x => Number(x.id_permiso) === Number(p.id_permiso) || Number(x.id) === Number(p.id_permiso));
        if (found) return normalizeKey(`${found.recurso || ''}:${found.accion || ''}`);
      }
      return null;
    };

    const keys = arr.map(toKey).filter(Boolean);
    console.log('[permissionService] my keys loaded:', keys);
    return keys;
  },

  assign: async ({ id_usuario, id_permiso }) => {
    const response = await api.post(`/permisos/asignar`, { id_usuario, id_permiso }, { headers: getAuthHeader() });
    return response.data;
  },

  revoke: async ({ id_usuario, id_permiso }) => {
    const response = await api.delete(`/permisos/asignar`, {
      headers: getAuthHeader(),
      data: { id_usuario, id_permiso },
    });
    return response.data;
  },
};

export default permissionService;