import React from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import './UserProfile.css'
import { Button } from '@mui/material'

const UserProfile = ({ onRequestCloseParent, onRequestOpenEdit }) => {
  const { user } = useAuth()

  if (!user) {
    return <div className="user-profile">No hay usuario autenticado.</div>
  }

  return (
    <div className="user-profile">
      <div className="user-profile__header">
        <div className="user-profile__avatar">
          {user.imagen_url ? (
            <img
              src={user.imagen_url.startsWith('http') ? user.imagen_url : (user.imagen_url.startsWith('/') ? user.imagen_url : `/${user.imagen_url}`)}
              alt="Avatar"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                console.error('Error loading image:', e.target.src);
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          {(!user.imagen_url || user.imagen_url) && (
            <span style={{
              position: user.imagen_url ? 'absolute' : 'static',
              top: '50%',
              left: '50%',
              transform: user.imagen_url ? 'translate(-50%, -50%)' : 'none',
              color: 'white',
              fontWeight: '700',
              fontSize: '20px',
              zIndex: user.imagen_url ? '1' : 'auto'
            }}>
              {user.nombres ? user.nombres.charAt(0).toUpperCase() : 'U'}
            </span>
          )}
        </div>
        <div className="user-profile__meta">
          <div className="user-profile__name">{user.nombres}</div>
          <div className="user-profile__email">{user.email}</div>
          <div className="user-profile__role">{user.roleLabel}</div>
        </div>
      </div>

      <div className="user-profile__body">
        <h3>Detalles</h3>
        <div className="user-profile__detail"><strong>Nombre:</strong> {user.nombres}</div>
        <div className="user-profile__detail"><strong>Email:</strong> {user.email}</div>
        <div className="user-profile__detail"><strong>Rol:</strong> {user.roleLabel}</div>
      </div>

      <div className="user-profile__actions">
        <Button
          variant="contained"
          onClick={() => { if (typeof onRequestOpenEdit === 'function') { onRequestOpenEdit() } else if (typeof onRequestCloseParent === 'function') { onRequestCloseParent() } }}
          sx={{
            backgroundColor: 'var(--primary-green, #2e7d32)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'var(--primary-green, #256028)'
            }
          }}
        >
          Editar perfil
        </Button>
      </div>
    </div>
  )
}

export default UserProfile
