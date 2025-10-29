import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useAlert } from '../../../contexts/AlertContext'
import Button from '../../atoms/Button/Button'
import Input from '../../atoms/Input/Input'
import './LoginForm.css'

const LoginForm = () => {
  const { login } = useAuth()
  const alert = useAlert()
  const [formData, setFormData] = useState({
    numero_documento: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.numero_documento.trim()) {
      newErrors.numero_documento = 'El número de identificación es requerido'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await login(formData)
      if (!result.success) {
        alert.error('Error de Inicio de Sesión', result.message)
      }
    } catch (error) {
      alert.error('Error de Conexión', 'Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__header">
        <h2 className="login-form__title">Iniciar Sesión</h2>
        <p className="login-form__subtitle">Accede a tu cuenta AgroTIC</p>
      </div>

      <div className="login-form__fields">
        <Input
          type="text"
          name="numero_documento"
          placeholder="Número de identificación"
          value={formData.numero_documento}
          onChange={handleChange}
          error={errors.numero_documento}
          disabled={loading}
          required
        />

        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={loading}
          required
        />
        <div className="forgot-password">
          <Link to="/forgot-password" className="forgot-password__link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>


      <div className="login-form__actions">
        <button
          type="submit"
          className="btn btn--primary btn--large"
          disabled={loading}
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </div>

      <div className="login-form__footer">
        <Link 
          to="/register" 
          className="btn btn--outline btn--medium btn--full-width"
        >
          Crear cuenta
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
