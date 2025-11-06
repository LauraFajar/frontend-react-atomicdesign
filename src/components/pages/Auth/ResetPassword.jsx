import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../../services/authService';
import './Auth.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      navigate('/login', { 
        state: { 
          error: 'Enlace inválido o expirado. Por favor solicita un nuevo enlace.' 
        } 
      });
      return;
    }
    
    setToken(tokenFromUrl);
    setIsValidating(false);
  }, [searchParams, navigate]);

  if (isValidating) {
    return (
      <div className="auth-container">
        <img 
          src="/logos/logo.svg" 
          alt="AgroTIC" 
          className="auth-logo"
        />
        <div className="auth-card">
          <h2>Validando enlace...</h2>
          <p className="auth-message">Por favor espera mientras validamos tu enlace de restablecimiento.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authService.resetPassword(token, password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.message || 'Ocurrió un error al restablecer la contraseña. Por favor, inténtalo de nuevo.');
      console.error('Error al restablecer contraseña:', err);
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
        <h2>Restablecer contraseña</h2>
        <p className="auth-message">
          Ingresa tu nueva contraseña. Asegúrate de que sea segura y no la compartas con nadie.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              placeholder="Mínimo 8 caracteres"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
              placeholder="Vuelve a escribir tu contraseña"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
