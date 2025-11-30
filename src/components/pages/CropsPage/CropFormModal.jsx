import React, { useState, useEffect } from 'react';
import { useAlert } from '../../../contexts/AlertContext';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import './CropFormModal.css';
import { useQuery } from '@tanstack/react-query';
import lotService from '../../../services/lotService';
 

const statusOptions = [
  { value: 'sembrado', label: 'Sembrado' },
  { value: 'en_crecimiento', label: 'En Crecimiento' },
  { value: 'cosechado', label: 'Cosechado' },
  { value: 'perdido', label: 'Perdido' }
];

const tipoCultivoOptions = [
  { value: 'transitorios', label: 'Transitorios' },
  { value: 'perennes', label: 'Perennes' },
  { value: 'semiperennes', label: 'Semiperennes' }
];

const CropFormModal = ({ open, onClose, onSave, crop }) => {
  const [formData, setFormData] = useState({
    nombre_cultivo: '',
    tipo_cultivo: 'transitorios',
    id_lote: '',
    fecha_siembra: null,
    fecha_cosecha_estimada: null,
    estado_cultivo: 'sembrado',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const alert = useAlert();

  const { data: lots = [] } = useQuery({
    queryKey: ['lots','crop-form'],
    queryFn: () => lotService.getLots(),
    staleTime: 60 * 1000,
  });
  

  useEffect(() => {
    if (crop) {
      setFormData({
        nombre_cultivo: crop.nombre_cultivo || '',
        tipo_cultivo: crop.tipo_cultivo || 'transitorios',
        id_lote: crop.id_lote || '',
        
        fecha_siembra: crop.fecha_siembra ? new Date(crop.fecha_siembra) : null,
        fecha_cosecha_estimada: crop.fecha_cosecha_estimada ? new Date(crop.fecha_cosecha_estimada) : null,
        estado_cultivo: crop.estado_cultivo || 'sembrado',
        observaciones: crop.observaciones || ''
      });
    } else {
      setFormData({
        nombre_cultivo: '',
        tipo_cultivo: 'transitorios',
        id_lote: '',
        
        fecha_siembra: null,
        fecha_cosecha_estimada: null,
        estado_cultivo: 'sembrado',
        observaciones: ''
      });
    }
  }, [crop, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre_cultivo.trim()) {
      newErrors.nombre_cultivo = 'El nombre del cultivo es requerido';
    }
    
    if (!formData.id_lote) {
      newErrors.id_lote = 'Debes seleccionar un lote';
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

  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setServerError('');
      setErrors({});
      
      const formattedData = {
        ...formData,
        nombre_cultivo: formData.nombre_cultivo?.toString().trim(),
        tipo_cultivo: formData.tipo_cultivo,
        id_lote: formData.id_lote ? parseInt(formData.id_lote, 10) : null,
        fecha_siembra: formData.fecha_siembra ? formData.fecha_siembra.toISOString() : null,
        fecha_cosecha_estimada: formData.fecha_cosecha_estimada ? formData.fecha_cosecha_estimada.toISOString() : null,
      };

      const wasCosechado = crop?.estado_cultivo === 'cosechado';
      const willBeCosechado = formattedData.estado_cultivo === 'cosechado';
      if (!wasCosechado && willBeCosechado) {
        formattedData.fecha_cosecha_real = new Date().toISOString();
      }
      
      await onSave(formattedData, !!crop);
      onClose();
    } catch (error) {
      console.error('Error al guardar el cultivo:', error);
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
          setServerError(msg);
          if (msg.toLowerCase().includes('nombre') || msg.toLowerCase().includes('cultivo')) {
            setErrors(prev => ({ ...prev, nombre_cultivo: msg }));
          }
          return;
        }
      }
      setServerError('Error al guardar el cultivo');
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
          {crop ? 'Editar Cultivo' : 'Nuevo Cultivo'}
        </DialogTitle>

        <DialogContent>
          {serverError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {serverError}
            </Typography>
          )}
          
          <TextField
            label="Nombre del Cultivo"
            name="nombre_cultivo"
            value={formData.nombre_cultivo}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.nombre_cultivo}
            helperText={errors.nombre_cultivo}
            className="modal-form-field"
          />

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Tipo de Cultivo</InputLabel>
            <Select
              name="tipo_cultivo"
              value={formData.tipo_cultivo}
              onChange={handleChange}
              label="Tipo de Cultivo"
            >
              {tipoCultivoOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth className="modal-form-field">
            <InputLabel id="lote-label">Lote</InputLabel>
            <Select
              labelId="lote-label"
              name="id_lote"
              label="Lote"
              value={formData.id_lote}
              onChange={handleChange}
              required
              error={!!errors.id_lote}
            >
              <MenuItem value=""><em>Seleccione lote...</em></MenuItem>
              {(Array.isArray(lots) ? lots : []).map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.nombre || `Lote ${l.id}`}</MenuItem>
              ))}
            </Select>
            {errors.id_lote && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.id_lote}
              </Typography>
            )}
          </FormControl>

          

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de Siembra"
              value={formData.fecha_siembra}
              onChange={handleDateChange('fecha_siembra')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.fecha_siembra,
                  helperText: errors.fecha_siembra,
                  className: "modal-form-field"
                }
              }}
            />

            <DatePicker
              label="Fecha de Cosecha Estimada"
              value={formData.fecha_cosecha_estimada}
              onChange={handleDateChange('fecha_cosecha_estimada')}
              minDate={formData.fecha_siembra}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.fecha_cosecha_estimada,
                  helperText: errors.fecha_cosecha_estimada,
                  className: "modal-form-field"
                }
              }}
            />
          </LocalizationProvider>

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Estado del Cultivo</InputLabel>
            <Select
              name="estado_cultivo"
              value={formData.estado_cultivo}
              onChange={handleChange}
              label="Estado del Cultivo"
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            className="modal-form-field"
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
            {loading ? <CircularProgress size={24} /> : crop ? 'Actualizar' : 'Crear Cultivo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CropFormModal;