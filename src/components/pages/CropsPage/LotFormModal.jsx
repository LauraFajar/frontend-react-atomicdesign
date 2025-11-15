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
import '../SublotsPage/SublotFormModal.css';

const LotFormModal = ({ open, onClose, onSave, lot, isLoading, error: serverError }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lot && lot.id) {
      setFormData({
        nombre: lot.nombre || '',
        descripcion: lot.descripcion || '',
        activo: lot.activo !== undefined ? lot.activo : true
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        activo: true
      });
    }
  }, [lot, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del lote es requerido';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setErrors({});
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
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
              disabled={isLoading}
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
              disabled={isLoading}
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
                  disabled={isLoading}
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
              {serverError.message || 'Ha ocurrido un error.'}
            </Typography>
          )}
        </DialogContent>

        <DialogActions className="dialog-actions">
          <Button onClick={handleClose} disabled={isLoading} variant="outlined" className="btn-cancel">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading} className="btn-save">
            {isLoading ? <CircularProgress size={24} /> : (lot ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LotFormModal;
