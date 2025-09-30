import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './RestrictedAccess.css';

const RestrictedAccess = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="restricted-access">
      <div className="restricted-access__card">
        <h1 className="restricted-access__title">Acceso restringido</h1>
        <p className="restricted-access__message">
          Hola {user?.nombres || 'Invitado'}, tu cuenta se encuentra registrada como <strong>Invitado</strong>.
        </p>
        <p className="restricted-access__message">
          Un administrador debe actualizar tu rol para que puedas acceder a la plataforma. Mientras tanto, puedes volver al inicio o cerrar sesión.
        </p>
        <div className="restricted-access__actions">
          <Link to="/login" className="restricted-access__button restricted-access__button--primary">
            Volver al inicio
          </Link>
          <button
            type="button"
            className="restricted-access__button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestrictedAccess;
