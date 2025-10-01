import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import './LotFormModal.css';

const LotFormModal = ({ open, onClose, onSave, lot }) => {
  const [formData, setFormData] = useState({
    nombre_lote: '',
    descripcion: '',
    activo: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    console.log('useEffect ejecutándose - lot recibido:', lot);
    console.log('¿Tiene ID el lote?', lot?.id);

    if (lot && lot.id) {
      console.log('Editando lote existente con ID:', lot.id);
      setFormData({
        nombre_lote: lot.nombre_lote || lot.nombre || '',
        descripcion: lot.descripcion || '',
        activo: lot.activo !== undefined ? lot.activo : true
      });
    } else {
      console.log('Creando nuevo lote - inicializando formulario vacío');
      setFormData({
        nombre_lote: '',
        descripcion: '',
        activo: true
      });
    }
  }, [lot, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre_lote.trim()) {
      newErrors.nombre_lote = 'El nombre del lote es requerido';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
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
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      activo: e.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      const submitData = {
        nombre_lote: formData.nombre_lote,
        descripcion: formData.descripcion,
        activo: formData.activo 
      };

      console.log('Datos a enviar:', submitData);
      console.log('Modo:', lot ? 'actualización' : 'creación');
      console.log('Estado del switch activo:', formData.activo);

      await onSave(submitData);
    } catch (error) {
      console.error('Error en el formulario:', error);
      console.error('Error response completo:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      setServerError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
      setServerError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {lot ? 'Editar Lote' : 'Nuevo Lote'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="form-field">
            <TextField
              fullWidth
              label="Nombre del Lote"
              name="nombre_lote"
              value={formData.nombre_lote}
              onChange={handleChange}
              error={!!errors.nombre_lote}
              helperText={errors.nombre_lote}
              disabled={loading}
              required
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0 !important',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50 !important',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50 !important',
                  borderWidth: '2px !important',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#4CAF50 !important',
                },
              }}
            />
          </div>

          <div className="form-field">
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              disabled={loading}
              required
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0 !important',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50 !important',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50 !important',
                  borderWidth: '2px !important',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#4CAF50 !important',
                },
              }}
            />
          </div>

          <div className="form-field">
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={handleSwitchChange}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4CAF50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4CAF50',
                    },
                    '& .MuiSwitch-switchBase': {
                      color: '#9e9e9e',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: '#e0e0e0',
                    },
                  }}
                />
              }
              label={formData.activo ? "Lote disponible" : "Lote ocupado"}
            />
          </div>

          {serverError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {serverError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: '#4CAF50',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.04)',
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#45a049',
              }
            }}
          >
            {loading ? 'Guardando...' : (lot ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LotFormModal;
