import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAlert } from '../../../contexts/AlertContext';
import LoginForm from '../../molecules/LoginForm/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
  const location = useLocation();
  const alert = useAlert();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.passwordReset) {
      alert.success('¡Éxito!', 'Tu contraseña ha sido restablecida exitosamente! Por favor inicia sesión con tu nueva contraseña.');
      window.history.replaceState({}, document.title);
    }

    if (location.state?.error) {
      alert.error('Error', location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location, alert]);

  return (
    <div className="login-page">
      <img 
        src="/logos/logo.svg" 
        alt="AgroTIC" 
        className="login-logo"
      />
      
      
      <LoginForm />
    </div>
  );
}

export default LoginPage
