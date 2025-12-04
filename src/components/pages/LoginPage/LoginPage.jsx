import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAlert } from '../../../contexts/AlertContext';
import LoginForm from '../../molecules/LoginForm/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
  const location = useLocation();
  const alert = useAlert();
  const navigate = useNavigate();
  const toastShownRef = useRef(false); 

  useEffect(() => {
    if (location.state?.passwordReset && !toastShownRef.current) {
      alert.success('¡Éxito!', 'Tu contraseña ha sido restablecida exitosamente! Por favor inicia sesión con tu nueva contraseña.');
      toastShownRef.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }

    if (location.state?.forgotPasswordSuccess && !toastShownRef.current) {
      alert.success('¡Enlace Enviado!', `Hemos enviado un enlace a ${location.state.email || 'tu correo electrónico'} para restablecer tu contraseña.`);
      toastShownRef.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }

    if (location.state?.error && !toastShownRef.current) {
      alert.error('Error', location.state.error);
      toastShownRef.current = true; 
      navigate(location.pathname, { replace: true, state: {} });
    }

    if (!location.state?.passwordReset && !location.state?.forgotPasswordSuccess && !location.state?.error) {
      toastShownRef.current = false;
    }
  }, [location, alert, navigate]);

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
