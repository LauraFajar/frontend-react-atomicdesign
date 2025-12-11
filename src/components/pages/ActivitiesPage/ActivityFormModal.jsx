import React, { useState, useEffect } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,Button,TextField,MenuItem,FormControl,InputLabel,Select,Typography,CircularProgress, Box} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import './ActivityFormModal.css';
import { useQuery } from '@tanstack/react-query';
import config from '../../../config/environment';
import activityService from '../../../services/activityService';
import userService from '../../../services/userService';
import insumosService from '../../../services/insumosService';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const canEditCosts = isAdmin || isInstructor;
  const [formData, setFormData] = useState({
    tipo_actividad: '',
    fecha: null,
    responsable: '',
    detalles: '',
    estado: 'pendiente',
    id_cultivo: '',
    costo_mano_obra: ''
  });
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { data: usersData } = useQuery({
    queryKey: ['users-basic','activity-form'],
    queryFn: async () => {
      try {
        const basic = await userService.getUsersBasic(1, 100);
        if (Array.isArray(basic?.items) && basic.items.length > 0) return basic;
      } catch (e) {
        console.warn('getUsersBasic failed', e);
      }
      const full = await userService.getUsers(1, 100);
      return full;
    },
    staleTime: 60 * 1000,
  });
  const users = Array.isArray(usersData?.items) ? usersData.items : [];

  const [insumos, setInsumos] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [errorInsumos, setErrorInsumos] = useState(null);

  const { data: photos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['activityPhotos', activity?.id],
    queryFn: () => activityService.getActivityPhotos(activity.id),
    enabled: !!activity?.id, 
  });

  useEffect(() => {
    const paramsFromStorage = () => {
      try {
        const key = formData.id_cultivo ? `financeParams:${formData.id_cultivo}` : null;
        if (!key) return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch { return null; }
    };
    if (activity) {
      setFormData({
        tipo_actividad: activity.tipo_actividad || '',
        fecha: activity.fecha ? new Date(activity.fecha) : null,
        responsable: activity.responsable || '',
        responsable_id: activity.responsable_id || '',
        detalles: activity.detalles || '',
        estado: activity.estado || 'pendiente',
        id_cultivo: activity.id_cultivo || '',
        costo_mano_obra: activity.costo_mano_obra ?? ''
      });
      setRecursos(Array.isArray(activity?.recursos) ? activity.recursos.map(r => ({
        id_insumo: r.id_insumo,
        cantidad: r.cantidad,
        horas_uso: r.horas_uso,
        costo_unitario: r.costo_unitario,
        es_herramienta: r.horas_uso != null ? true : undefined,
      })) : []);
      const p = paramsFromStorage();
      if (p && (activity.costo_mano_obra == null || activity.costo_mano_obra === '')) {
        const tipo = String(activity.tipo_actividad || '').toLowerCase();
        const horasTipo = Number((p.horasPorTipo || {})[tipo] || 0);
        const costoHora = Number(p.costoHora || 0);
        const sugerido = horasTipo * costoHora;
        if (sugerido > 0) setFormData(prev => ({ ...prev, costo_mano_obra: sugerido }));
      }
    } else {
      setFormData({
        tipo_actividad: '',
        fecha: new Date(), // Fecha actual por defecto
        responsable: '',
        responsable_id: '',
        detalles: '',
        estado: 'pendiente',
        id_cultivo: '',
        costo_mano_obra: ''
      });
      setRecursos([]);
    }
  }, [activity, open]);

  useEffect(() => {
    if (!open) return;
    setLoadingInsumos(true);
    setErrorInsumos(null);
    insumosService
      .getInsumos(1, 200)
      .then((list) => setInsumos(list))
      .catch((e) => setErrorInsumos(e?.message || 'Error al cargar insumos'))
      .finally(() => setLoadingInsumos(false));
  }, [open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo_actividad.trim()) {
      newErrors.tipo_actividad = 'El tipo de actividad es requerido';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (!formData.responsable_id) {
      newErrors.responsable = 'Selecciona un responsable';
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
        responsable_id: formData.responsable_id ? parseInt(formData.responsable_id, 10) : undefined,
        detalles: formData.detalles?.toString().trim(),
        estado: formData.estado?.toString().trim(),
        id_cultivo: formData.id_cultivo ? parseInt(formData.id_cultivo, 10) : null,
        fecha: formData.fecha ? formData.fecha.toISOString() : null,
        costo_mano_obra: formData.costo_mano_obra !== '' && formData.costo_mano_obra != null ? Number(formData.costo_mano_obra) : undefined,
        recursos: recursos
          .filter(r => r && r.id_insumo)
          .map(r => ({
            id_insumo: Number(r.id_insumo),
            cantidad: r.cantidad != null && r.cantidad !== '' ? Number(r.cantidad) : undefined,
            horas_uso: r.horas_uso != null && r.horas_uso !== '' ? Number(r.horas_uso) : undefined,
            costo_unitario: r.costo_unitario != null && r.costo_unitario !== '' ? Number(r.costo_unitario) : undefined,
          })),
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

  const addRecurso = () => {
    setRecursos(prev => [...prev, { id_insumo: '', cantidad: '', horas_uso: '', costo_unitario: '' }]);
  };

  const removeRecurso = (index) => {
    setRecursos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecursoChange = (index, field, value) => {
    const next = [...recursos];
    next[index] = { ...next[index], [field]: value };
    if (field === 'id_insumo') {
      const sel = insumos.find(i => String(i.id) === String(value));
      if (sel?.es_herramienta || next[index].es_herramienta === true) {
        next[index].cantidad = '';
      } else {
        next[index].horas_uso = '';
      }
    }
    if (field === 'es_herramienta') {
      if (String(value) === 'true') {
        next[index].es_herramienta = true;
        next[index].cantidad = '';
      } else {
        next[index].es_herramienta = false;
        next[index].horas_uso = '';
      }
    }
    setRecursos(next);
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

          <FormControl fullWidth className="modal-form-field">
            <InputLabel>Responsable</InputLabel>
            <Select
              name="responsable_id"
              value={formData.responsable_id}
              onChange={(e) => {
                const { value } = e.target;
                const sel = users.find(u => String(u.id) === String(value));
                setFormData(prev => ({
                  ...prev,
                  responsable_id: value,
                  responsable: sel?.nombres || prev.responsable,
                }));
              }}
              label="Responsable"
              required
              error={!!errors.responsable}
            >
              <MenuItem value=""><em>Seleccionar usuario...</em></MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>{u.nombres}</MenuItem>
              ))}
            </Select>
            {errors.responsable && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.responsable}
              </Typography>
            )}
          </FormControl>

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

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {canEditCosts && (
              <TextField
                type="number"
                label="Costo mano de obra"
                name="costo_mano_obra"
                value={formData.costo_mano_obra}
                onChange={handleChange}
                inputProps={{ min: 0, step: '0.01' }}
                className="modal-form-field"
              />
            )}
          </Box>

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

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Recursos utilizados</Typography>
            {loadingInsumos ? (
              <CircularProgress />
            ) : errorInsumos ? (
              <Typography color="error">{errorInsumos}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {recursos.map((r, idx) => {
                  const sel = insumos.find(i => String(i.id) === String(r.id_insumo));
                  const isTool = r.es_herramienta !== undefined ? Boolean(r.es_herramienta) : !!sel?.es_herramienta;
                  return (
                    <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '0.9fr 1.8fr 1.2fr 1.1fr 0.8fr max-content', gap: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={isTool ? 'herramienta' : 'consumible'}
                          label="Tipo"
                          onChange={(e) => handleRecursoChange(idx, 'es_herramienta', e.target.value === 'herramienta' ? 'true' : 'false')}
                        >
                          <MenuItem value="consumible">Consumible</MenuItem>
                          <MenuItem value="herramienta">Herramienta</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                        <InputLabel>Insumo</InputLabel>
                        <Select
                          value={r.id_insumo}
                          label="Insumo"
                          onChange={(e) => handleRecursoChange(idx, 'id_insumo', e.target.value)}
                        >
                          {insumos.map(i => (
                            <MenuItem key={i.id} value={i.id}>{i.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {isTool ? (
                        <TextField
                          type="number"
                          label="Horas uso"
                          value={r.horas_uso}
                          onChange={(e) => handleRecursoChange(idx, 'horas_uso', e.target.value)}
                          inputProps={{ min: 0, step: '0.1' }}
                          fullWidth
                          size="small"
                          margin="dense"
                        />
                      ) : (
                        <TextField
                          type="number"
                          label="Cantidad"
                          value={r.cantidad}
                          onChange={(e) => handleRecursoChange(idx, 'cantidad', e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          fullWidth
                          size="small"
                          margin="dense"
                        />
                      )}
                      {!isTool && (
                        <TextField
                          type="number"
                          label="Costo unitario"
                          value={r.costo_unitario}
                          onChange={(e) => handleRecursoChange(idx, 'costo_unitario', e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          fullWidth
                          size="small"
                          margin="dense"
                        />
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ px: 1, py: 0.25, minWidth: 48, minHeight: 22, height: 28, fontSize: '0.7rem', lineHeight: 1 }}
                        onClick={() => removeRecurso(idx)}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  );
                })}
                <Button variant="text" size="small" onClick={addRecurso}>Agregar recurso</Button>
              </Box>
            )}
          </Box>

          {activity && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Fotodocumentación</Typography>
              {isLoadingPhotos ? (
                <CircularProgress />
              ) : photos && photos.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {photos.map((photo) => (
                    <Box key={photo.id || photo.id_foto} sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2 }}>
                      <img 
                        src={(() => {
                          const v = photo.ruta_foto || photo.url_imagen || '';
                          if (!v) return '';
                          if (v.startsWith('http')) return v;
                          const base = (config.api.baseURL || '').replace(/\/$/, '');
                          const rel = v.startsWith('/') ? v : `/${v}`;
                          return `${base}${rel}`;
                        })()}
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
