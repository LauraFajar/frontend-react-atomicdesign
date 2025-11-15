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

const InventoryMovementModal = ({ open, onCancel, onSave, movement }) => {
  const [form, setForm] = useState({ id_insumo: '', tipo_movimiento: '', cantidad: 0, unidad: '', fecha: '' });
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
    const toDateInput = (value) => {
      if (!value) {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return typeof value === 'string' ? value : '';
    };

    if (movement?.id) {
      setForm({
        id_insumo: String(movement.id_insumo || ''),
        tipo_movimiento: String(movement.tipo_movimiento || 'entrada').toLowerCase(),
        cantidad: Number(movement.cantidad || 0),
        unidad: movement.unidad_medida || movement.unidad || '',
        fecha: toDateInput(movement.fecha_movimiento || movement.fecha),
      });
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const base = { id_insumo: '', tipo_movimiento: 'entrada', cantidad: 0, unidad: '', fecha: todayStr };
      const prefill = movement ? {
        id_insumo: movement.id_insumo != null ? String(movement.id_insumo) : base.id_insumo,
        tipo_movimiento: movement.tipo_movimiento ? String(movement.tipo_movimiento).toLowerCase() : base.tipo_movimiento,
        cantidad: movement.cantidad != null ? Number(movement.cantidad) : base.cantidad,
        unidad: movement.unidad_medida || movement.unidad || base.unidad,
        fecha: toDateInput(movement.fecha_movimiento || movement.fecha) || base.fecha,
      } : base;
      setForm(prefill);
    }
  }, [open, movement]);

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
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{movement?.id ? 'Editar movimiento' : 'Registrar movimiento'}</DialogTitle>
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