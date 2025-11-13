import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress
} from '@mui/material';
import './UserFormModal.css';

const documentTypeOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PAS', label: 'Pasaporte' }
];

const normalizeTipoDocumento = (val) => {
  if (!val && val !== '') return 'CC';
  const v = String(val).toUpperCase().replace(/\./g, '').trim();
  if (v === 'CC' || v === 'C' || v === 'CEDULA' || v === 'CEDULADECIUDADANIA') return 'CC';
  if (v === 'CE' || v === 'CEX' || v === 'CEDULAEXTRANJERIA') return 'CE';
  if (v === 'TI' || v === 'TARJETA' || v === 'TARJETADEIDENTIDAD') return 'TI';
  if (v === 'PAS' || v === 'PASAPORTE') return 'PAS';
  return 'CC';
};

const UserFormModal = ({ open, onClose, onSave, user, roles }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    email: '',
    tipo_documento: 'CC',
    numero_documento: '',
    id_rol: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      const roleExists = Array.isArray(roles) && roles.some(r => String(r.id_rol) === String(user.id_rol));
      setFormData({
        nombres: user.nombres || '',
        email: user.email || '',
        tipo_documento: normalizeTipoDocumento(user.tipo_documento || 'CC'),
        numero_documento: user.numero_documento || '',
        id_rol: roleExists ? String(user.id_rol) : '',
        password: '' 
      });
    } else {
      setFormData({
        nombres: '',
        email: '',
        tipo_documento: 'CC',
        numero_documento: '',
        id_rol: '',
        password: ''
      });
    }
    setErrors({});
  }, [user, open, roles]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.numero_documento.trim()) {
      newErrors.numero_documento = 'El número de documento es requerido';
    } else if (!/^\d+$/.test(formData.numero_documento)) {
      newErrors.numero_documento = 'El número de documento debe contener solo números';
    }

    if (!formData.id_rol) {
      newErrors.id_rol = 'Debes seleccionar un rol';
    }

    if (!user) {
      if (!formData.password.trim()) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      let formattedData;

      if (user) {
        formattedData = {
          nombres: formData.nombres?.toString().trim(),
          email: formData.email?.toString().trim(),
          tipo_documento: normalizeTipoDocumento(formData.tipo_documento),
          numero_documento: formData.numero_documento?.toString().trim(),
          id_rol: formData.id_rol ? parseInt(formData.id_rol, 10) : null
        };

        if (formData.password.trim()) {
          formattedData.password = formData.password;
        }
      } else {
        formattedData = {
          nombres: formData.nombres?.toString().trim(),
          email: formData.email?.toString().trim(),
          tipo_documento: normalizeTipoDocumento(formData.tipo_documento),
          numero_documento: formData.numero_documento?.toString().trim(),
          id_rol: formData.id_rol ? parseInt(formData.id_rol, 10) : null,
          password: formData.password
        };
      }

      console.log('[UserFormModal] Sending data:', formattedData);

      await onSave(formattedData);
      onClose();
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const newErrors = {};
          Object.keys(data.errors).forEach((key) => {
            const val = data.errors[key];
            newErrors[key] = Array.isArray(val) ? val.join(', ') : String(val);
          });
          setErrors(prev => ({ ...prev, ...newErrors }));
          return;
        }
        if (data.message) {
          const msg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
          if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('usuario')) {
            setErrors(prev => ({ ...prev, email: msg }));
          } else if (msg.toLowerCase().includes('nombre')) {
            setErrors(prev => ({ ...prev, nombres: msg }));
          } else if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('contraseña')) {
            setErrors(prev => ({ ...prev, password: msg }));
          }
          return;
        }
      }
      setErrors({ general: 'Error al guardar el usuario' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className="modal-title">
          {user ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>

        <DialogContent>
          {errors.general && (
            <Typography color="error" sx={{ mb: 2 }}>
              {errors.general}
            </Typography>
          )}

          <TextField
            label="Nombres completos"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.nombres}
            helperText={errors.nombres}
            className="modal-form-field"
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.email}
            helperText={errors.email}
            className="modal-form-field"
          />

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Tipo de Documento</InputLabel>
            <Select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              label="Tipo de Documento"
            >
              {documentTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Número de Documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.numero_documento}
            helperText={errors.numero_documento}
            className="modal-form-field"
          />

          {/* Campo de contraseña - solo visible en creación */}
          {!user && (
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              fullWidth
              error={!!errors.password}
              helperText={errors.password || 'Mínimo 6 caracteres'}
              className="modal-form-field"
            />
          )}

          <FormControl fullWidth className="modal-form-field" error={!!errors.id_rol}>
            <InputLabel>Rol</InputLabel>
            <Select
              name="id_rol"
              value={formData.id_rol}
              onChange={handleChange}
              label="Rol"
            >
              {roles.map(role => (
                <MenuItem key={role.id_rol} value={String(role.id_rol)}>
                  {role.nombre_rol}
                </MenuItem>
              ))}
            </Select>
            {errors.id_rol && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                {errors.id_rol}
              </Typography>
            )}
          </FormControl>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <Button
            onClick={onClose}
            variant="outlined"
            className="btn-cancel"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            className="btn-save"
          >
            {loading ? <CircularProgress size={24} /> : user ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormModal;
