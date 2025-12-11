import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const InventoryItemModal = ({ open, selectedItem, onCancel, onSave, categorias = [], almacenes = [] }) => {
  const [form, setForm] = useState({ 
    nombre: '', 
    cantidad: 0, 
    unidad: '', 
    ultima_fecha: '', 
    observacion: '', 
    id_categoria: '', 
    id_almacen: '',
    es_herramienta: false,
    costo_compra: '',
    vida_util_horas: '',
    fecha_compra: ''
  });
  const [error, setError] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (selectedItem) {
      setForm({
        nombre: selectedItem.nombre ?? selectedItem.insumo?.nombre_insumo ?? '',
        cantidad: Number(selectedItem.cantidad ?? 0),
        unidad: selectedItem.unidad ?? '',
        ultima_fecha: selectedItem.ultima_fecha ?? '',
        observacion: selectedItem.observacion ?? '',
        id_categoria: '',
        id_almacen: '',
        es_herramienta: selectedItem.es_herramienta || false,
        costo_compra: selectedItem.costo_compra || '',
        vida_util_horas: selectedItem.vida_util_horas || '',
        fecha_compra: selectedItem.fecha_compra || '',
      });
    } else {
      setForm({ 
        nombre: '', 
        cantidad: 0, 
        unidad: '', 
        ultima_fecha: '', 
        observacion: '', 
        id_categoria: '', 
        id_almacen: '',
        es_herramienta: false,
        costo_compra: '',
        vida_util_horas: '',
        fecha_compra: ''
      });
    }
    setTimeout(() => {
      const el = firstInputRef.current;
      if (el && typeof el.focus === 'function') { el.focus(); }
    }, 0);
  }, [open, selectedItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setForm((f) => ({ ...f, [name]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.unidad) {
      setError('Completa Nombre y Unidad');
      return;
    }
    const creatingNew = !selectedItem;
    if (creatingNew && (!form.id_categoria || !form.id_almacen)) {
      setError('Selecciona Categoría y Almacén');
      return;
    }
    const payload = {
      ...form,
      id_categoria: form.id_categoria ? Number(form.id_categoria) : undefined,
      id_almacen: form.id_almacen ? Number(form.id_almacen) : undefined,
      costo_compra: form.es_herramienta && form.costo_compra ? Number(form.costo_compra) : undefined,
      vida_util_horas: form.es_herramienta && form.vida_util_horas ? Number(form.vida_util_horas) : undefined,
      fecha_compra: form.es_herramienta && form.fecha_compra ? form.fecha_compra : undefined,
    };
    onSave?.(payload);
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
            inputRef={firstInputRef}
          />

          {!selectedItem && (
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
          )}

        <TextField
          fullWidth
          name="unidad"
          label="Unidad"
          value={form.unidad}
          onChange={handleChange}
          required
          className="modal-form-field"
        />

        <FormControl fullWidth className="modal-form-field">
          <InputLabel id="categoria-label">Categoría</InputLabel>
          <Select
            labelId="categoria-label"
            label="Categoría"
            name="id_categoria"
            value={form.id_categoria}
            onChange={handleChange}
            required
            error={!selectedItem && !form.id_categoria}
          >
            <MenuItem value=""><em>Seleccione categoría</em></MenuItem>
            {(Array.isArray(categorias?.items) ? categorias.items : categorias).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth className="modal-form-field">
          <InputLabel id="almacen-label">Almacén</InputLabel>
          <Select
            labelId="almacen-label"
            label="Almacén"
            name="id_almacen"
            value={form.id_almacen}
            onChange={handleChange}
            required
            error={!selectedItem && !form.id_almacen}
          >
            <MenuItem value=""><em>Seleccione almacén</em></MenuItem>
            {(Array.isArray(almacenes?.items) ? almacenes.items : almacenes).map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

          <TextField
            type="date"
            fullWidth
            name="ultima_fecha"
            label="Fecha de entrada"
            placeholder="YYYY-MM-DD"
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

          <FormControlLabel
            control={
              <Checkbox
                name="es_herramienta"
                checked={form.es_herramienta}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Es herramienta/equipo"
            className="modal-form-field"
          />

          {form.es_herramienta && (
            <>
              <TextField
                type="number"
                fullWidth
                name="costo_compra"
                label="Costo de compra"
                value={form.costo_compra}
                onChange={handleChange}
                className="modal-form-field"
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                type="number"
                fullWidth
                name="vida_util_horas"
                label="Vida útil (horas)"
                value={form.vida_util_horas}
                onChange={handleChange}
                className="modal-form-field"
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                type="date"
                fullWidth
                name="fecha_compra"
                label="Fecha de compra"
                value={form.fecha_compra}
                onChange={handleChange}
                className="modal-form-field"
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

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
