import React, { useState, useEffect } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,Button,TextField,MenuItem,FormControl,InputLabel,Select,Typography,CircularProgress, Box} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import './ActivityFormModal.css';
import { useQuery } from '@tanstack/react-query';
import activityService from '../../../services/activityService';

const activityTypes = [
  { value: 'siembra', label: 'Siembra' },
  { value: 'riego', label: 'Riego' },
  { value: 'fertilizacion', label: 'Fertilización' },
  { value: 'poda', label: 'Poda' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'otro', label: 'Otro' }
];

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' }
];

const ActivityFormModal = ({ open, onClose, onSave, activity, crops = [] }) => {
  const [formData, setFormData] = useState({
    tipo_actividad: '',
    fecha: null,
    responsable: '',
    detalles: '',
    estado: 'pendiente',
    id_cultivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { data: photos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['activityPhotos', activity?.id_actividad],
    queryFn: () => activityService.getActivityPhotos(activity.id_actividad),
    enabled: !!activity?.id_actividad, 
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        tipo_actividad: activity.tipo_actividad || '',
        fecha: activity.fecha ? new Date(activity.fecha) : null,
        responsable: activity.responsable || '',
        detalles: activity.detalles || '',
        estado: activity.estado || 'pendiente',
        id_cultivo: activity.id_cultivo || ''
      });
    } else {
      setFormData({
        tipo_actividad: '',
        fecha: new Date(), // Fecha actual por defecto
        responsable: '',
        detalles: '',
        estado: 'pendiente',
        id_cultivo: ''
      });
    }
  }, [activity, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo_actividad.trim()) {
      newErrors.tipo_actividad = 'El tipo de actividad es requerido';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (!formData.responsable.trim()) {
      newErrors.responsable = 'El responsable es requerido';
    }

    if (!formData.id_cultivo) {
      newErrors.id_cultivo = 'Debe seleccionar un cultivo';
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

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      fecha: date
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
        tipo_actividad: formData.tipo_actividad?.toString().trim(),
        responsable: formData.responsable?.toString().trim(),
        detalles: formData.detalles?.toString().trim(),
        estado: formData.estado?.toString().trim(),
        id_cultivo: formData.id_cultivo ? parseInt(formData.id_cultivo, 10) : null,
        fecha: formData.fecha ? formData.fecha.toISOString() : null,
      };

      await onSave(formattedData);
      onClose();
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
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
          return;
        }
      }
      setServerError('Error al guardar la actividad');
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
      className="activity-modal"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className="modal-title">
          {activity ? 'Editar Actividad' : 'Nueva Actividad'}
        </DialogTitle>

        <DialogContent>
          {serverError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {serverError}
            </Typography>
          )}

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Tipo de Actividad</InputLabel>
            <Select
              name="tipo_actividad"
              value={formData.tipo_actividad}
              onChange={handleChange}
              label="Tipo de Actividad"
              error={!!errors.tipo_actividad}
            >
              {activityTypes.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.tipo_actividad && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.tipo_actividad}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Cultivo</InputLabel>
            <Select
              name="id_cultivo"
              value={formData.id_cultivo}
              onChange={handleChange}
              label="Cultivo"
              error={!!errors.id_cultivo}
            >
              <MenuItem value="">
                <em>Seleccionar cultivo...</em>
              </MenuItem>
              {crops.map(crop => (
                <MenuItem key={crop.id} value={crop.id}>
                  {crop.displayName || crop.nombre_cultivo || crop.tipo_cultivo}
                </MenuItem>
              ))}
            </Select>
            {errors.id_cultivo && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.id_cultivo}
              </Typography>
            )}
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de la Actividad"
              value={formData.fecha}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.fecha,
                  helperText: errors.fecha,
                  className: "modal-form-field"
                }
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Responsable"
            name="responsable"
            value={formData.responsable}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.responsable}
            helperText={errors.responsable}
            className="modal-form-field"
          />

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              label="Estado"
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Detalles"
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            className="modal-form-field"
            placeholder="Describe los detalles de la actividad..."
          />

          {activity && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Fotodocumentación</Typography>
              {isLoadingPhotos ? (
                <CircularProgress />
              ) : photos && photos.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {photos.map((photo) => (
                    <Box key={photo.id_foto} sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2 }}>
                      <img 
                        src={`/${photo.ruta_foto?.startsWith('/') ? photo.ruta_foto.substring(1) : photo.ruta_foto}`}
                        alt={photo.descripcion}
                        style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>{photo.descripcion}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography>No hay fotos para esta actividad.</Typography>
              )}
            </Box>
          )}
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
            {loading ? <CircularProgress size={24} /> : activity ? 'Actualizar' : 'Crear Actividad'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ActivityFormModal;
