import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';

const InventoryItemModal = ({ open, selectedItem, onCancel, onSave }) => {
  const [form, setForm] = useState({ nombre: '', cantidad: 0, unidad: '', ultima_fecha: '', observacion: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (selectedItem) {
      setForm({
        nombre: selectedItem.nombre ?? selectedItem.insumo?.nombre_insumo ?? '',
        cantidad: Number(selectedItem.cantidad ?? 0),
        unidad: selectedItem.unidad ?? '',
        ultima_fecha: selectedItem.ultima_fecha ?? '',
        observacion: selectedItem.observacion ?? '',
      });
    } else {
      setForm({ nombre: '', cantidad: 0, unidad: '', ultima_fecha: '', observacion: '' });
    }
  }, [open, selectedItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle className="modal-title">
        {selectedItem ? 'Actualizar Insumo' : 'Nuevo Insumo'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            name="nombre"
            label="Nombre del insumo"
            value={form.nombre}
            onChange={handleChange}
            required
            className="modal-form-field"
          />

          <TextField
            type="number"
            fullWidth
            name="cantidad"
            label="Cantidad"
            value={form.cantidad}
            onChange={handleChange}
            required
            className="modal-form-field"
            inputProps={{ min: 0 }}
          />

          <TextField
            fullWidth
            name="unidad"
            label="Unidad"
            value={form.unidad}
            onChange={handleChange}
            required
            className="modal-form-field"
          />

          <TextField
            type="date"
            fullWidth
            name="ultima_fecha"
            label="Última fecha"
            value={form.ultima_fecha}
            onChange={handleChange}
            className="modal-form-field"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            name="observacion"
            label="Observación"
            value={form.observacion}
            onChange={handleChange}
            className="modal-form-field"
            inputProps={{ maxLength: 50 }}
            helperText={`Máximo 50 caracteres (${Math.min(50, (form.observacion || '').length)}/50)`}
          />

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
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary-green)',
                '&:hover': { backgroundColor: 'var(--dark-green)' }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryItemModal;