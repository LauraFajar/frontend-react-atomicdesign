import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAlert } from '../../../contexts/AlertContext';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Register = () => {
  const alert = useAlert();
  const [formData, setFormData] = useState({
    nombres: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipo_documento: 'C.C.',
    numero_documento: '',
    id_rol: '5'
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const documentTypes = [
    { value: 'C.C.', label: 'Cédula de Ciudadanía (C.C.)' },
    { value: 'T.I.', label: 'Tarjeta de Identidad (T.I.)' },
    { value: 'C.E.', label: 'Cédula de Extranjería (C.E.)' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert.error('Error de Validación', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      alert.error('Error de Validación', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Crear objeto con los datos a enviar (sin confirmPassword)
      const userData = { ...formData };
      delete userData.confirmPassword;

      const userDataToSend = {
        ...userData,
        id_rol: 5
      };

      console.log('Enviando datos al servidor:', userDataToSend);

      const response = await axios.post(`${API_URL}/auth/register`, userDataToSend);
      console.log('Respuesta del servidor:', response.data);

      alert.success('¡Registro Exitoso!', 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión con tus credenciales.');
      navigate('/login');

    } catch (error) {
      console.error('Error en el registro:', error);
      alert.error('Error de Registro', error.response?.data?.message || 'Error al registrar el usuario. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <img
        src="/logos/logo.svg"
        alt="AgroTIC"
        className="auth-logo"
      />
      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <p className="auth-message">
          Completa el formulario para crear tu cuenta en AgroTIC.
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombres">Nombres completos</label>
            <input
              type="text"
              id="nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Ingresa tus nombres completos"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tipo_documento">Tipo de documento</label>
            <select
              id="tipo_documento"
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              className="form-input"
              required
            >
              {documentTypes.map((docType) => (
                <option key={docType.value} value={docType.value}>
                  {docType.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="numero_documento">Número de documento</label>
            <input
              type="text"
              id="numero_documento"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Ingresa tu número de documento"
            />
          </div>
          
          <input type="hidden" name="id_rol" value={formData.id_rol} />
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="8"
              className="form-input"
              placeholder="Vuelve a escribir tu contraseña"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        
        <p className="auth-footer">
          ¿Ya tienes una cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
