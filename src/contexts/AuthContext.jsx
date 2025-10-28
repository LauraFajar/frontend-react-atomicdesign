import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext()

const API_BASE_URL = 'http://localhost:3001'
axios.defaults.baseURL = API_BASE_URL

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
    id: rawUser.id || rawUser.id_usuarios || null,
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

  useEffect(() => {
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
      } catch (e) {
        console.error('Error parsing stored user:', e);
        Cookies.remove('user');
      }
    } else {
      console.log('[AuthContext] no user in cookies');
    }

    setLoading(false);
  }, []);

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
      const response = await axios.post('/auth/login', credentials)
      const { access_token, user: responseUser } = response.data

      // Guardar token y usuario en cookies
      Cookies.set('token', access_token, { expires: 7, secure: true, sameSite: 'strict' });
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const normalizedUser = normalizeUser(responseUser);
      Cookies.set('user', JSON.stringify(normalizedUser), { expires: 7, secure: true, sameSite: 'strict' });
      setUser(normalizedUser);
      console.log('[AuthContext] login successful, user set:', normalizedUser)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)

      if (error.response?.status === 401) {
        logout()
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
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

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
