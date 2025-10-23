import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import './EpaForm.css';

const EpaForm = ({ open, onClose, onSubmit, epa }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'enfermedad',
    estado: 'activo',
    imagen: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (epa) {
      setFormData({
        id: epa.id,
        nombre: epa.nombre || '',
        descripcion: epa.descripcion || '',
        tipo: epa.tipo || 'enfermedad',
        estado: epa.estado || 'activo',
        imagen: epa.imagen || null
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'enfermedad',
        estado: 'activo',
        imagen: null
      });
    }
  }, [epa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    
    if (!formData.tipo) {
      newErrors.tipo = 'El tipo es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar EPA:', error);
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
      <DialogTitle className="modal-title">
        {epa ? 'Editar EPA' : 'Nueva EPA'}
      </DialogTitle>
      
      <DialogContent>
        {Object.keys(errors).length > 0 && (
          <div className="form-error">
            <Typography color="error">
              Por favor, corrige los errores en el formulario
            </Typography>
          </div>
        )}
        
        <div className="modal-form-field">
          <TextField
            label="Nombre de EPA"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ingresa el nombre de la EPA"
            fullWidth
            variant="outlined"
            required
            error={!!errors.nombre}
            helperText={errors.nombre}
          />
        </div>
        
        <div className="modal-form-field">
          <TextField
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ingresa una descripción detallada"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            required
            error={!!errors.descripcion}
            helperText={errors.descripcion}
          />
        </div>
        
        <div className="modal-form-field">
          <FormControl fullWidth variant="outlined" error={!!errors.tipo}>
            <Typography variant="body2" gutterBottom>
              Tipo <span className="required">*</span>
            </Typography>
            <Select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
            >
              <MenuItem value="enfermedad">Enfermedad</MenuItem>
              <MenuItem value="plaga">Plaga</MenuItem>
              <MenuItem value="arvense">Arvense</MenuItem>
            </Select>
            {errors.tipo && (
              <Typography variant="caption" color="error">
                {errors.tipo}
              </Typography>
            )}
          </FormControl>
        </div>
        
        <div className="modal-form-field">
          <FormControl fullWidth variant="outlined">
            <Typography variant="body2" gutterBottom>
              Estado
            </Typography>
            <Select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        <div className="modal-form-field">
          <Typography variant="body2" gutterBottom>
            Imagen de referencia
          </Typography>
          <TextField
            type="file"
            name="imagen"
            onChange={(e) => {
              console.log('Archivo seleccionado:', e.target.files[0]);
            }}
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </div>
      </DialogContent>
      
      <DialogActions className="dialog-actions">
        <Button 
          type="button"
          variant="outlined" 
          onClick={onClose}
          className="btn-cancel"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          variant="contained" 
          className="btn-save"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? <CircularProgress size={24} /> : (epa ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EpaForm;