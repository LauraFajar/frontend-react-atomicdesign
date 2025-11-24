import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { FiUser, FiLogOut, FiChevronDown, FiEdit } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box
} from '@mui/material'
import { Close } from '@mui/icons-material'
import UserProfile from '../UserProfile/UserProfile'
import UserProfileEditModal from '../UserProfile/UserProfileEditModal'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

  const handleViewProfile = () => {
    setIsProfileModalOpen(true)
    setIsProfileOpen(false)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleOpenEditFromProfile = () => {
    setIsProfileModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  return (
    <header className="header">
      <div className="header__content">
        <div className="header__actions">
          {/* Perfil de usuario */}
          <div className="header__user" ref={profileRef}>
            <button
              className="header__user-button"
              onClick={toggleProfile}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              {user?.imagen_url ? (
                <img
                  src={user.imagen_url.startsWith('http') ? user.imagen_url : (user.imagen_url.startsWith('/') ? user.imagen_url : `/${user.imagen_url}`)}
                  alt="Avatar"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <FiUser size={20} />
              )}
              <FiChevronDown size={16} className="header__user-chevron" />
            </button>

            {isProfileOpen && user && (
              <div className="header__user-dropdown">
                <div className="header__user-info">
                  <div className="header__user-name">
                    {user.nombres}
                  </div>
                  <div className="header__user-email">
                    {user.email}
                  </div>
                  <div className="header__user-role">
                    {user.roleLabel}
                  </div>
                </div>
                <div className="header__user-menu">
                  <button
                    className="header__user-menu-item"
                    onClick={handleViewProfile}
                  >
                    <FiEdit size={16} />
                    Ver Perfil
                  </button>
                </div>
                <button
                  className="header__user-logout"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Perfil */}
      <Dialog
        open={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
            m: 0,
            p: 2,
            position: 'relative',
            textAlign: 'center',
            color: 'var(--text-dark)',
            fontWeight: 600
          }}>
            <Box component="span" sx={{ display: 'block' }}>Mi Perfil</Box>
            <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
              <IconButton
                onClick={handleCloseProfileModal}
                sx={{
                  color: 'var(--medium-gray)',
                  '&:hover': {
                    color: 'var(--primary-green)',
                    backgroundColor: 'var(--light-green)'
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 3 }}>
            <UserProfile onRequestCloseParent={handleCloseProfileModal} onRequestOpenEdit={handleOpenEditFromProfile} />
          </Box>
        </DialogContent>
      </Dialog>
      <UserProfileEditModal open={isEditModalOpen} onClose={handleCloseEditModal} />
    </header>
  )
}

export default Header
