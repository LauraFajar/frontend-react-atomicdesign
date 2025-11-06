import React, { useEffect, useMemo, useState } from 'react';

const InventoryExitModal = ({ open, items = [], insumos = [], onCancel, onSave }) => {
  const [form, setForm] = useState({ nombre: '', tipo: 'salida', cantidad: 0, unidad: '', fecha: '' });

  useEffect(() => {
    if (!open) {
      setForm({ nombre: '', tipo: 'salida', cantidad: 0, unidad: '', fecha: '' });
    }
  }, [open]);

  const insumosByName = useMemo(() => {
    const map = new Map();
    (insumos || []).forEach(i => map.set(String(i.nombre).toLowerCase(), i));
    return map;
  }, [insumos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };
    if (name === 'nombre') {
      const match = insumosByName.get(String(value).toLowerCase());
      if (match && !next.unidad) next.unidad = match.unidad || '';
    }
    setForm(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cantidad = Number(form.cantidad || 0);
    onSave?.({ ...form, cantidad });
  };

  if (!open) return null;

  return (
    <div className="inventory-modal-backdrop" onClick={onCancel}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Registro de salida</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="tipo"
            placeholder="tipo de movimiento"
            value={form.tipo}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="cantidad"
            placeholder="Cantidad"
            value={form.cantidad}
            onChange={handleChange}
            min="0"
            required
          />
          <input
            type="text"
            name="unidad"
            placeholder="Unidad de medida"
            value={form.unidad}
            onChange={handleChange}
          />
          <input
            type="date"
            name="fecha"
            placeholder="DD/MM/AAAA"
            value={form.fecha}
            onChange={handleChange}
            required
          />
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryExitModal;