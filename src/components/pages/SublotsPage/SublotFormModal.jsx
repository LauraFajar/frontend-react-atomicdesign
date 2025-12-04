import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import lotService from '../../../services/lotService';
import './SublotFormModal.css';

const SublotFormModal = ({ open, onClose, onSave, sublot }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    ubicacion: '',
    id_lote: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: lotService.getLots,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (sublot) {
      setFormData({
        descripcion: sublot.descripcion || '',
        ubicacion: sublot.ubicacion || '',
        id_lote: (() => {
          const rel = sublot.id_lote;
          if (rel == null) return '';
          if (typeof rel === 'object') return rel.id_lote ?? rel.id ?? '';
          return rel;
        })()
      });
    } else {
      setFormData({
        descripcion: '',
        ubicacion: '',
        id_lote: ''
      });
    }
  }, [sublot, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida';
    }

    if (!formData.id_lote || formData.id_lote < 1) {
      newErrors.id_lote = 'El ID del lote es requerido y debe ser mayor a 0';
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
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      setServerError(error.message || 'Error al guardar el sublote');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog 
      open={open} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className="modal-title">
          {sublot ? 'Editar Sublote' : 'Nuevo Sublote'}
        </DialogTitle>

        <DialogContent>
          {serverError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {serverError}
            </Typography>
          )}
          
          <TextField
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            className="modal-form-field"
          />

          <TextField
            label="Ubicación"
            name="ubicacion"
            value={formData.ubicacion}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.ubicacion}
            helperText={errors.ubicacion}
            className="modal-form-field"
          />

          <Autocomplete
            options={Array.isArray(lots) ? lots : []}
            getOptionLabel={(option) => option?.nombre ? String(option.nombre) : `Lote ${option?.id ?? ''}`}
            value={(Array.isArray(lots) ? lots : []).find((l) => String(l.id) === String(formData.id_lote)) || null}
            onChange={(_, option) => setFormData((prev) => ({ ...prev, id_lote: option?.id ?? '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lote asociado"
                required
                fullWidth
                error={!!errors.id_lote}
                helperText={errors.id_lote}
                className="modal-form-field"
              />
            )}
          />
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
            {loading ? <CircularProgress size={24} /> : (sublot ? 'Actualizar' : 'Crear Sublote')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SublotFormModal;
