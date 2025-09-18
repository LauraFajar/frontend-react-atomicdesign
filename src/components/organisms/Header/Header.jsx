import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { FiBell, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
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
          <div className="header__user" ref={profileRef}>
            <button 
              className="header__user-button"
              onClick={toggleProfile}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <FiUser size={20} />
              <FiChevronDown size={16} className="header__user-chevron" />
            </button>
            
            {isProfileOpen && user && (
              <div className="header__user-dropdown">
                <div className="header__user-email">
                  {user.email}
                </div>
              </div>
            )}
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
