import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  CircularProgress
} from '@mui/material';
import insumosService from '../../../../services/insumosService';
import { useAlert } from '../../../../contexts/AlertContext';

const tipoOptions = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
];

const InventoryMovementModal = ({ open, onCancel, onSave }) => {
  const [form, setForm] = useState({ id_insumo: '', tipo_movimiento: '', cantidad: 0, unidad: '', fecha: '', responsable: '', observacion: '' });
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alert = useAlert();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    insumosService
      .getInsumos(1, 100)
      .then((list) => setInsumos(list))
      .catch((e) => setError(e?.message || 'Error al cargar insumos'))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setForm({ id_insumo: '', tipo_movimiento: 'entrada', cantidad: 0, unidad: '', fecha: todayStr, responsable: '', observacion: '' });
  }, [open]);

  const handleChange = (field) => (e) => {
    const value = field === 'cantidad' ? Number(e.target.value) : e.target.value;
    const next = { ...form, [field]: value };
    if (field === 'id_insumo') {
      const sel = insumos.find((i) => String(i.id) === String(value));
      next.unidad = sel?.unidad || next.unidad;
    }
    setForm(next);
  };

  const canSave = () => {
    return form.id_insumo && form.tipo_movimiento && Number(form.cantidad) > 0 && form.unidad && form.fecha;
  };

  const handleSave = () => {
    if (!canSave()) {
      alert.error('Validación', 'Completa Insumo, Tipo, Cantidad (>0), Unidad y Fecha');
      return;
    }
    onSave?.({
      id_insumo: Number(form.id_insumo),
      tipo_movimiento: form.tipo_movimiento,
      cantidad: Number(form.cantidad),
      unidad_medida: form.unidad,
      fecha_movimiento: form.fecha,
      responsable: form.responsable,
      observacion: form.observacion,
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Registrar movimiento</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <CircularProgress />
          </div>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TextField
              select
              label="Insumo"
              value={form.id_insumo}
              onChange={handleChange('id_insumo')}
              fullWidth
              required
              className="modal-form-field"
            >
              {insumos.map((i) => (
                <MenuItem key={i.id} value={i.id}>{i.nombre} ({i.codigo})</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo de movimiento"
              value={form.tipo_movimiento}
              onChange={handleChange('tipo_movimiento')}
              fullWidth
              required
              className="modal-form-field"
            >
              {tipoOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label="Cantidad"
              value={form.cantidad}
              onChange={handleChange('cantidad')}
              fullWidth
              inputProps={{ min: 0 }}
              required
              className="modal-form-field"
            />

            <TextField
              label="Unidad"
              value={form.unidad}
              onChange={handleChange('unidad')}
              fullWidth
              required
              className="modal-form-field"
            />

            <TextField
              type="date"
              label="Fecha"
              value={form.fecha}
              onChange={handleChange('fecha')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
              className="modal-form-field"
            />

            <TextField
              label="Responsable"
              value={form.responsable}
              onChange={handleChange('responsable')}
              fullWidth
              className="modal-form-field"
            />

            <TextField
              label="Observación"
              value={form.observacion}
              onChange={handleChange('observacion')}
              fullWidth
              multiline
              rows={3}
              className="modal-form-field"
            />
          </>
        )}
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button
          onClick={onCancel}
          sx={{
            color: 'var(--primary-green)',
            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: 'var(--primary-green)',
            '&:hover': { backgroundColor: 'var(--dark-green)' },
            '&.Mui-disabled': {
              backgroundColor: 'var(--primary-green)',
              color: '#fff',
              opacity: 0.6
            }
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryMovementModal;