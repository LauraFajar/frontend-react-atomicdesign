import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Avatar } from '@mui/material'
import { useAuth } from '../../../contexts/AuthContext'
import userService from '../../../services/userService'

const docTypes = [
  { value: 'C.C.', label: 'Cédula de ciudadanía' },
  { value: 'T.I.', label: 'Tarjeta de identidad' },
  { value: 'C.E.', label: 'Cédula de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' }
]

const UserProfileEditModal = ({ open, onClose }) => {
  const { user } = useAuth() || {}
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
    setAvatarPreview(user?.imagen_url || user?.avatarUrl || '')
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
      alert('Las contraseñas no coinciden')
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

      if (avatarFile) {
        const fd = new FormData()
        Object.keys(changed).forEach(k => fd.append(k, changed[k]))
        fd.append('imagen_url', avatarFile)

  try { for (const pair of fd.entries()) console.log('[UserProfileEditModal] FormData entry:', pair[0], pair[1]) } catch(e){ console.warn('Could not iterate FormData entries for logging', e) }

        const updated = await userService.updateUser(user.id, fd)
        localStorage.setItem('user', JSON.stringify(updated))
      } else {
        if (Object.keys(changed).length === 0) {
          console.log('[UserProfileEditModal] no changes to update')
        } else {
          const updated = await userService.updateUser(user.id, changed)
          localStorage.setItem('user', JSON.stringify(updated))
        }
      }
    } catch (err) {
      console.error('Error updating user', err)
      if (avatarFile) {
        try {
          console.log('[UserProfileEditModal] attempting base64 fallback')
          const fileToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = (e) => reject(e)
            reader.readAsDataURL(file)
          })
          const base64 = await fileToBase64(avatarFile)
          const payload = {
            nombres: form.nombres,
            email: form.email,
            tipo_documento: form.tipoDocumento,
            numero_documento: form.numeroDocumento,
            imagen_url: base64
          }
          if (form.password) payload.password = form.password
          console.log('[UserProfileEditModal] retrying with JSON payload (base64)')
          const updated2 = await userService.updateUser(user.id, payload)
          localStorage.setItem('user', JSON.stringify(updated2))
        } catch (err2) {
          console.error('Base64 fallback failed', err2)
        }
      }
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
