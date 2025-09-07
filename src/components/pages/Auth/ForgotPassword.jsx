import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../../services/authService';
import '../../atoms/Button/Button.css';
import './Auth.css';

const SuccessModal = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 9000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-icon">✓</div>
        <h3>¡Enlace enviado!</h3>
        <p>Hemos enviado un enlace a tu correo electrónico para restablecer tu contraseña.</p>
        <button 
          className="modal-close-btn"
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    
    try {
      await authService.requestPasswordReset(email);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al enviar el correo. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar correo de restablecimiento:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
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
        
        {error && <div className="auth-error">{error}</div>}
        
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
      
      {showModal && <SuccessModal onClose={closeModal} />}
    </div>
  );
};

export default ForgotPassword;
