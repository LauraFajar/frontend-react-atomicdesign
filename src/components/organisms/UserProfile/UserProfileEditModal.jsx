import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Avatar } from '@mui/material'
import { useAuth } from '../../../contexts/AuthContext'
import { useAlert } from '../../../contexts/AlertContext'
import userService from '../../../services/userService'

const docTypes = [
  { value: 'C.C.', label: 'Cédula de ciudadanía' },
  { value: 'T.I.', label: 'Tarjeta de identidad' },
  { value: 'C.E.', label: 'Cédula de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' }
]

const UserProfileEditModal = ({ open, onClose }) => {
  const { user, updateUser } = useAuth() || {}
  const alert = useAlert()
  const [form, setForm] = useState({
    nombres: '',
    email: '',
    tipoDocumento: '',
    numeroDocumento: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setForm({
      nombres: user?.nombres || '',
      email: user?.email || '',
      tipoDocumento: user?.tipo_documento || user?.tipoDocumento || '',
      numeroDocumento: user?.numero_documento || user?.numeroDocumento || '',
      password: ''
    })
    setConfirmPassword('')
    setAvatarFile(null)
    setAvatarPreview(user?.imagen_url ? `http://localhost:3001${user.imagen_url}` : '')
  }, [user, open])

  useEffect(() => {
    if (!avatarFile) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(avatarFile)
  }, [avatarFile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) setAvatarFile(file)
  }
  const handleSubmit = async () => {
    if (form.password && form.password !== confirmPassword) {
      alert.error('Error de Validación', 'Las contraseñas no coinciden')
      return
    }

    if (!user || !user.id) {
      console.warn('[UserProfileEditModal] no user.id available to update')
      return
    }

    try {
      const changed = {}
      if ((form.nombres || '') !== (user.nombres || '')) changed.nombres = form.nombres
      if ((form.email || '') !== (user.email || '')) changed.email = form.email
      if ((form.tipoDocumento || '') !== (user.tipo_documento || user.tipoDocumento || '')) changed.tipo_documento = form.tipoDocumento
      if ((form.numeroDocumento || '') !== (user.numero_documento || user.numeroDocumento || '')) changed.numero_documento = form.numeroDocumento
      if (form.password && form.password.trim()) changed.password = form.password

      let updated = null

      // Primero actualizar los datos del usuario si hay cambios
      if (Object.keys(changed).length > 0) {
        console.log('[UserProfileEditModal] updating user data:', changed)
        updated = await userService.updateUser(user.id, changed)
        updateUser(updated)
      }

      // Luego subir la imagen si hay una seleccionada
      if (avatarFile) {
        console.log('[UserProfileEditModal] uploading user image')
        updated = await userService.uploadUserImage(user.id, avatarFile)
        updateUser(updated)
      }

      if (avatarFile && Object.keys(changed).length > 0) {
        alert.success('¡Perfil Actualizado!', 'Tu perfil y foto han sido actualizados correctamente.')
      } else if (avatarFile) {
        alert.success('¡Foto Actualizada!', 'Tu foto de perfil ha sido actualizada correctamente.')
      } else if (Object.keys(changed).length > 0) {
        alert.success('¡Perfil Actualizado!', 'Tu perfil ha sido actualizado correctamente.')
      } else {
        alert.success('¡Perfil Actualizado!', 'No se detectaron cambios en tu perfil.')
      }
    } catch (err) {
      console.error('Error updating user', err)
      alert.error('Error de Actualización', err.message || 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.')
    }
  }

  const greenFieldSx = {
    '& .MuiInputLabel-root': {
      color: 'var(--primary-green, #2e7d32) !important'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'var(--primary-green, #2e7d32) !important'
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'var(--primary-green, #2e7d32) !important'
      },
      '&:hover fieldset': {
        borderColor: 'var(--primary-green, #256028) !important'
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--primary-green, #2e7d32) !important'
      },
      '& input': {
        color: 'var(--text-dark, #000) !important'
      },
      '& textarea': {
        color: 'var(--text-dark, #000) !important'
      }
    },
    '& .MuiSelect-select': {
      color: 'var(--text-dark, #000) !important'
    },
    '& .MuiInputBase-input': {
      color: 'var(--text-dark, #000) !important'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Perfil</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
          <Avatar src={avatarPreview} sx={{ width: 64, height: 64 }} />
          <Box>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              sx={{
                backgroundColor: 'white',
                color: 'var(--primary-green, #2e7d32)',
                borderColor: 'var(--primary-green, #2e7d32)',
                '&:hover': {
                  backgroundColor: 'rgba(46,125,50,0.04)'
                }
              }}
            >
              Cambiar foto
            </Button>
            {avatarFile && <Box component="span" sx={{ ml: 1 }}>{avatarFile.name}</Box>}
          </Box>
        </Box>

        <TextField
          fullWidth
          margin="normal"
          label="Nombres"
          name="nombres"
          value={form.nombres}
          onChange={handleChange}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Tipo de documento"
          name="tipoDocumento"
          value={form.tipoDocumento}
          onChange={handleChange}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        >
          {docTypes.map((d) => (
            <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          margin="normal"
          label="Número de documento"
          name="numeroDocumento"
          value={form.numeroDocumento}
          onChange={handleChange}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={greenFieldSx}
          InputLabelProps={{ sx: { color: 'var(--primary-green, #2e7d32)' } }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            backgroundColor: 'white',
            color: 'var(--primary-green, #2e7d32)',
            borderColor: 'var(--primary-green, #2e7d32)',
            '&:hover': {
              backgroundColor: 'rgba(46,125,50,0.04)'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            backgroundColor: 'var(--primary-green, #2e7d32)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'var(--primary-green, #256028)'
            }
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserProfileEditModal
