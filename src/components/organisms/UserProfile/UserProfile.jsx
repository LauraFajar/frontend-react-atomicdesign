import React from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import './UserProfile.css'
import { Button } from '@mui/material'

const UserProfile = ({ onRequestCloseParent, onRequestOpenEdit }) => {
  const { user } = useAuth() || {}

  if (!user) {
    return <div className="user-profile">No hay usuario autenticado.</div>
  }

  return (
    <div className="user-profile">
      <div className="user-profile__header">
        <div className="user-profile__avatar">{user.nombres ? user.nombres.charAt(0) : 'U'}</div>
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
