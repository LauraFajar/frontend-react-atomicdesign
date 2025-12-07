import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  InputLabel
} from '@mui/material';
import './TratamientoForm.css';

const initialValues = { descripcion: '', dosis: '', frecuencia: '', id_epa: '', tipo: 'biologico' };

const validate = (values) => {
  const errors = {};
  const len = (s) => (s || '').trim().length;
  if (!len(values.descripcion) || len(values.descripcion) > 500) errors.descripcion = '1–500 caracteres';
  if (!len(values.dosis) || len(values.dosis) > 100) errors.dosis = '1–100 caracteres';
  if (!len(values.frecuencia) || len(values.frecuencia) > 100) errors.frecuencia = '1–100 caracteres';
  if (!values.id_epa) errors.id_epa = 'EPA requerido';
  if (!values.tipo) errors.tipo = 'Tipo requerido';
  return errors;
};

const TratamientoForm = ({ open, onClose, onSubmit, tratamiento, epas = [] }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tratamiento) {
      const epaId = tratamiento.id_epa?.id_epa || tratamiento.id_epa || '';
      
      setValues({
        descripcion: tratamiento.descripcion || '',
        dosis: tratamiento.dosis || '',
        frecuencia: tratamiento.frecuencia || '',
        id_epa: epaId,
        tipo: tratamiento.tipo?.toLowerCase() || 'biologico'
      });
    } else {
      setValues(initialValues);
    }
    setErrors({});
  }, [tratamiento, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const vErrors = validate(values);
    setErrors(vErrors);
    if (Object.keys(vErrors).length === 0) {
      setLoading(true);
      try {
        const tipoNormalized = String(values.tipo || '').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const tipoBackend = tipoNormalized === 'biologico' ? 'Biologico' : 'Quimico';
        await onSubmit({ ...values, id_epa: Number(values.id_epa), tipo: tipoBackend });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const title = tratamiento ? 'Editar Tratamiento' : 'Nuevo Tratamiento';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle className="modal-title">
        {title}
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
            label="Descripción"
            name="descripcion"
            value={values.descripcion}
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
              Tipo de Tratamiento <span className="required">*</span>
            </Typography>
            <Select
              name="tipo"
              value={values.tipo}
              onChange={handleChange}
            >
              <MenuItem value="biologico" className="tipo-biologico">Biológico</MenuItem>
              <MenuItem value="quimico" className="tipo-quimico">Químico</MenuItem>
            </Select>
            {errors.tipo && (
              <Typography variant="caption" color="error">
                {errors.tipo}
              </Typography>
            )}
          </FormControl>
        </div>
        
        <div className="modal-form-field">
          <TextField
            label="Dosis"
            name="dosis"
            value={values.dosis}
            onChange={handleChange}
            placeholder="Ej: 200ml/ha, 2kg/ha"
            fullWidth
            variant="outlined"
            required
            error={!!errors.dosis}
            helperText={errors.dosis}
          />
        </div>
        
        <div className="modal-form-field">
          <TextField
            label="Frecuencia"
            name="frecuencia"
            value={values.frecuencia}
            onChange={handleChange}
            placeholder="Ej: Cada 15 días, semanal"
            fullWidth
            variant="outlined"
            required
            error={!!errors.frecuencia}
            helperText={errors.frecuencia}
          />
        </div>
        
        <div className="modal-form-field">
          <FormControl fullWidth variant="outlined" error={!!errors.id_epa}>
            <Typography variant="body2" gutterBottom>
              EPA <span className="required">*</span>
            </Typography>
            <Select
              name="id_epa"
              value={values.id_epa}
              onChange={handleChange}
            >
              {epas.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.nombre || e.descripcion || `EPA ${e.id}`}</MenuItem>
              ))}
            </Select>
            {errors.id_epa && (
              <Typography variant="caption" color="error">
                {errors.id_epa}
              </Typography>
            )}
          </FormControl>
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
          {loading ? <CircularProgress size={24} /> : (tratamiento ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TratamientoForm;