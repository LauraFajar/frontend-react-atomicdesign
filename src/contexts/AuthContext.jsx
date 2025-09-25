import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

const API_BASE_URL = 'http://localhost:3001'
axios.defaults.baseURL = API_BASE_URL

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
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setIsAuthenticated(true)
      console.log('[AuthContext] token found in localStorage')
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        console.log('[AuthContext] user loaded from localStorage:', parsed)
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('user')
      }
    } else {
      console.log('[AuthContext] no user in localStorage')
    }

    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials)
      const { access_token, user } = response.data

      // Guardar token
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  // Normalizar role a minúsculas y guardar user en localStorage para persistencia de sesión
  // Soportar distintos formatos que el backend pueda devolver para el usuario.
  // Algunas respuestas traen 'id_usuarios' y un objeto 'id_rol' con 'nombre_rol'.
  const extractRole = (u) => {
    if (!u) return ''
    // prioridad: user.role | user.rol | user.id_rol.nombre_rol
    const r = u.role || u.rol || (u.id_rol && (u.id_rol.nombre_rol || u.id_rol.nombreRol)) || ''
    return r.toString().toLowerCase()
  }

  const normalizedUser = user ? {
    id: user.id || user.id_usuarios || null,
    nombres: user.nombres || user.nombre || '',
    apellidos: user.apellidos || '',
    email: user.email || user.correo || '',
    raw: user,
    role: extractRole(user)
  } : user
  localStorage.setItem('user', JSON.stringify(normalizedUser))
  setUser(normalizedUser)
  console.log('[AuthContext] login successful, user set:', normalizedUser)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

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
