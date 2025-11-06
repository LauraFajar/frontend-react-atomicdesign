import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAlert } from '../../../contexts/AlertContext';
import authService from '../../../services/authService';
import '../../atoms/Button/Button.css';
import './Auth.css';

const ForgotPassword = () => {
  const alert = useAlert();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email);
      navigate('/login', { state: { forgotPasswordSuccess: true, email: email } });
    } catch (err) {
      alert.error('Error', err.message || 'Ocurrió un error al enviar el correo. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar correo de restablecimiento:', err);
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
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
    </div>
  );
};

export default ForgotPassword;
