import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAlert } from '../../../contexts/AlertContext';
import authService from '../../../services/authService';
import '../../atoms/Button/Button.css';
import './Auth.css';


const ForgotPassword = () => {
  const alert = useAlert();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert.error('Error de Validación', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      alert.success('¡Enlace Enviado!', 'Hemos enviado un enlace a tu correo electrónico para restablecer tu contraseña.');
      setSubmitted(true);
    } catch (err) {
      alert.error('Error', err.message || 'Ocurrió un error al enviar el correo. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar correo de restablecimiento:', err);
    } finally {
      setLoading(false);
    }
  };


  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Revisa tu correo</h2>
          <p className="auth-message">
            Si el correo {email} está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <img 
        src="/logos/logo.svg" 
        alt="AgroTIC" 
        className="auth-logo"
      />
      <div className="auth-card">
        <h2>¿Olvidaste tu contraseña?</h2>
        <p className="auth-message">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tucorreo@ejemplo.com"
              className="form-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
      
    </div>
  );
};

export default ForgotPassword;
