import React from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { FiBell, FiUser, FiLogOut } from 'react-icons/fi'
import Button from '../../atoms/Button/Button'
import './Header.css'

const Header = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="header">
      <div className="header__content">
        <div className="header__actions">
          {/* Notificaciones */}
          <button className="header__action-button" title="Notificaciones">
            <FiBell size={20} />
            <span className="header__notification-badge">3</span>
          </button>

          {/* Perfil de usuario */}
          <div className="header__user">
            <button className="header__user-button">
              <FiUser size={20} />
            </button>
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="header__logout"
            title="Cerrar sesión"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
