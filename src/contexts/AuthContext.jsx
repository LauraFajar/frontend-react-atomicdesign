import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/environment';
import permissionService from '../services/permissionService';

const AuthContext = createContext()

axios.defaults.baseURL = config.api.baseURL
axios.defaults.timeout = config.api.timeout

const ROLE_ID_MAP = {
  1: 'Instructor',
  2: 'Aprendiz',
  3: 'Pasante',
  4: 'Administrador',
  5: 'Invitado'
}

const resolveRoleId = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  return null
}

const extractRoleId = (user) => {
  if (!user) return null

  const direct = resolveRoleId(user.id_rol)
  if (direct) return direct

  if (user.id_rol && typeof user.id_rol === 'object') {
    const nestedCandidates = [
      user.id_rol.id,
      user.id_rol.id_rol,
      user.id_rol.idRol,
      user.id_rol.codigo
    ]

    for (const candidate of nestedCandidates) {
      const resolved = resolveRoleId(candidate)
      if (resolved) return resolved
    }
  }

  const altCandidates = [
    user.role_id,
    user.rol_id,
    user.idRol,
    user.roleId,
    user.rolId
  ]

  for (const candidate of altCandidates) {
    const resolved = resolveRoleId(candidate)
    if (resolved) return resolved
  }

  return null
}

const isNumericString = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return Number.isFinite(Number(trimmed))
}

const formatRoleLabel = (role) => {
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1)
}

const extractRole = (user) => {
  if (!user) return ''

  const candidates = [
    user.role,
    user.rol,
    user.rol_nombre,
    user.role_name,
    user.roleName,
    user.nombreRol,
    user.nombre_rol,
    user.id_rol && (user.id_rol.nombre_rol || user.id_rol.nombreRol)
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const candidateStr = candidate.toString().trim()
    if (!candidateStr) continue
    if (isNumericString(candidateStr)) continue
    return candidateStr.toLowerCase()
  }

  const roleId = extractRoleId(user)

  if (roleId && ROLE_ID_MAP[roleId]) {
    return ROLE_ID_MAP[roleId].toString().toLowerCase()
  }

  const fallback =
    typeof user.id_rol === 'string' && !isNumericString(user.id_rol)
      ? user.id_rol
      : ''

  return fallback ? fallback.toLowerCase() : ''
}

const normalizeUser = (rawUser) => {
  if (!rawUser) return null

  const roleId = extractRoleId(rawUser)
  const role = extractRole(rawUser)
  const roleLabel = ROLE_ID_MAP[roleId] || formatRoleLabel(role)

  return {
    id: rawUser.id || rawUser.id_usuarios || rawUser.id_usuario || rawUser.idUsuarios || rawUser.idUsuario || null,
    nombres: rawUser.nombres || rawUser.nombre || '',
    email: rawUser.email || rawUser.correo || '',
    imagen_url: rawUser.imagen_url || '',
    raw: rawUser,
    role,
    roleId,
    roleLabel
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState(null)

  const normalizeKey = (k) => {
    const s = (k || '').toString().trim().toLowerCase()
    if (!s) return ''
    let n = s.replace(/[._]/g, ':')
    n = n.replace(/:+/g, ':')
    n = n.replace(/:\*+/g, ':*')
    n = n.endsWith(':') ? n.slice(0, -1) : n
    return n
  }

  const canonicalAction = (a) => {
    const s = (a || '').toString().trim().toLowerCase()
    if (!s) return ''
    if (['ver', 'listar', 'read', 'list', 'view'].includes(s)) return 'read'
    if (['crear', 'create', 'new', 'add'].includes(s)) return 'create'
    if (['editar', 'update', 'edit', 'modificar'].includes(s)) return 'update'
    if (['eliminar', 'delete', 'remove', 'borrar'].includes(s)) return 'delete'
    if (['exportar', 'export', 'descargar', 'download', 'exportar_excel', 'exportar_pdf', 'export_excel', 'export_pdf'].includes(s)) return 'export'
    return s
  }

  const hasPermission = (keyOrResource, action) => {
    const roleId = user?.roleId
    const role = user?.role
    if (roleId === 4 || role === 'administrador') return true
    const key = normalizeKey(action ? `${keyOrResource}:${action}` : keyOrResource)
    const normalizedPerms = Array.isArray(permissions) ? permissions.map(p => normalizeKey(p)) : []
    const set = new Set(normalizedPerms)
    if (key.includes(':')) {
      const [res, act] = key.split(':')
      const canon = canonicalAction(act)
      return set.has(key) || set.has(`${res}:${canon}`) || set.has(`${res}:*`)
    }
    return normalizedPerms.some(p => p.startsWith(`${key}:`))
  }

  const hasAnyPermission = (keys) => {
    const roleId = user?.roleId
    const role = user?.role
    if (roleId === 4 || role === 'administrador') return true
    if (!Array.isArray(keys) || !keys.length) return false
    const normalizedPerms = Array.isArray(permissions) ? permissions.map(p => normalizeKey(p)) : []
    const set = new Set(normalizedPerms)
    const hasResourcePrefix = (resource) => normalizedPerms.some(p => p.startsWith(`${resource}:`))
    const result = keys.some(k => {
      const nk = normalizeKey(k)
      if (!nk) return false
      if (nk.includes(':*')) {
        const resource = nk.split(':')[0]
        return hasResourcePrefix(resource)
      }
      if (nk.includes(':')) {
        const [res, act] = nk.split(':')
        const canon = canonicalAction(act)
        return set.has(nk) || set.has(`${res}:${canon}`) || set.has(`${res}:*`)
      }
      return hasResourcePrefix(nk)
    })

    try {
      console.debug('[AuthContext] hasAnyPermission', { keys, normalizedPerms, result })
    } catch (e) {
      console.warn('[AuthContext] hasAnyPermission debug log failed', e)
    }

    return result
  }

  const loadPermissions = useCallback(async (userId) => {
    try {
      const currentId = userId || user?.id
      if (!currentId) return

      let keys = []
      try {
        keys = await permissionService.getMyKeys()
      } catch (errMe) {
        const statusMe = errMe?.response?.status
        console.warn('[AuthContext] getMyKeys falló con status:', statusMe)
        if (currentId) {
          console.warn('[AuthContext] intentando fallback vía /permisos/usuario/:id', currentId)
          try {
            keys = await permissionService.getUserKeys(currentId)
          } catch (errById) {
            console.warn('[AuthContext] fallback /:id también falló', errById?.response?.status)
            keys = []
          }
        } else {
          keys = []
        }
      }

      const normalized = Array.isArray(keys)
        ? keys.filter(Boolean).map(k => normalizeKey(k))
        : []
      setPermissions(normalized)
      console.log('[AuthContext] permisos cargados (me/id:', currentId, '):', normalized)
    } catch (e) {
      console.warn('[AuthContext] Unable to load permissions', e)
      setPermissions([])
    }
  }, [user?.id])

  const refreshPermissions = async (userId) => {
    await loadPermissions(userId || user?.id)
  }

  useEffect(() => {
    (async () => {
      const token = Cookies.get('token');
      const storedUser = Cookies.get('user');

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
        console.log('[AuthContext] token found in cookies');
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const normalizedFromStorage = parsed?.raw
            ? normalizeUser(parsed.raw)
            : normalizeUser(parsed);
          setUser(normalizedFromStorage);
          console.log('[AuthContext] user loaded from cookies:', normalizedFromStorage);
          if (token && normalizedFromStorage?.id) {
            await loadPermissions(normalizedFromStorage.id)
          } else {
            console.log('[AuthContext] skip loadPermissions: missing token or user id')
            setPermissions([])
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
          Cookies.remove('user');
          setPermissions([])
        }
      } else {
        console.log('[AuthContext] no user in cookies');
        setPermissions([])
      }

      setLoading(false);
    })()
  }, [loadPermissions])

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('[AuthContext] 401 error detected, logging out user')
          logout()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const payload = {
        password: credentials?.password
      }
      if (credentials?.email) payload.email = credentials.email
      if (credentials?.numero_documento) payload.numero_documento = credentials.numero_documento

      const response = await axios.post('/auth/login', payload)
      const { access_token, user: responseUser } = response.data

      // Guardar token y usuario en cookies
      const cookieOptions = { expires: 7, secure: config.isProduction(), sameSite: 'lax' };
      Cookies.set('token', access_token, cookieOptions);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const normalizedUser = normalizeUser(responseUser);
      Cookies.set('user', JSON.stringify(normalizedUser), cookieOptions);
      setUser(normalizedUser);
      console.log('[AuthContext] login successful, user set:', normalizedUser)
      setIsAuthenticated(true)

      // Cargar permisos tras login
      await loadPermissions(normalizedUser?.id)

      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)

      if (error.response?.status === 401) {
        logout()
      }

      return {
        success: false,
        message: error.response?.data?.message || (!error.response ? 'Servidor no disponible. Verifica que la API esté ejecutándose en http://localhost:3001' : 'Error al iniciar sesión')
      }
    }
  }

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error en registro:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar usuario'
      }
    }
  }

  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    setUser(normalizedUser);
    const cookieOptions = { expires: 7, secure: config.isProduction(), sameSite: 'lax' };
    Cookies.set('user', JSON.stringify(normalizedUser), cookieOptions);
    console.log('[AuthContext] user updated:', normalizedUser);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    updateUser,
    permissions,
    hasPermission,
    hasAnyPermission,
    refreshPermissions
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
