import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../../molecules/LoginForm/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.passwordReset) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        window.history.replaceState({}, document.title);
      }, 5000);
      return () => clearTimeout(timer);
    }
    
    if (location.state?.error) {
      setError(location.state.error);
      const timer = setTimeout(() => {
        setError('');
        window.history.replaceState({}, document.title);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="login-page">
      <img 
        src="/logos/logo.svg" 
        alt="AgroTIC" 
        className="login-logo"
      />
      
      {showSuccess && (
        <div className="auth-success-message">
          ¡Tu contraseña ha sido restablecida exitosamente! Por favor inicia sesión con tu nueva contraseña.
        </div>
      )}
      
      {error && (
        <div className="auth-error-message">
          {error}
        </div>
      )}
      
      <LoginForm />
    </div>
  );
}

export default LoginPage
