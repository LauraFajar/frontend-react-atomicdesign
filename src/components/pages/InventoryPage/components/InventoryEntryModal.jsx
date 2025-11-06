import React, { useEffect, useMemo, useState } from 'react';

const InventoryEntryModal = ({ open, insumos = [], onCancel, onSave }) => {
  const [form, setForm] = useState({ nombre: '', codigo: '', responsable: '', fecha: '', observacion: '' });

  useEffect(() => {
    if (!open) {
      setForm({ nombre: '', codigo: '', responsable: '', fecha: '', observacion: '' });
    }
  }, [open]);

  const insumosByName = useMemo(() => {
    const map = new Map();
    (insumos || []).forEach(i => map.set(String(i.nombre).toLowerCase(), i));
    return map;
  }, [insumos]);

  const insumoByCode = useMemo(() => {
    const map = new Map();
    (insumos || []).forEach(i => map.set(String(i.id), i));
    return map;
  }, [insumos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };
    if (name === 'nombre') {
      const match = insumosByName.get(String(value).toLowerCase());
      if (match) next.codigo = match.id;
    }
    if (name === 'codigo') {
      const match = insumoByCode.get(value);
      if (match) next.nombre = match.nombre;
    }
    setForm(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  if (!open) return null;

  return (
    <div className="inventory-modal-backdrop" onClick={onCancel}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Registro de entrada</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre insumo"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="codigo"
            placeholder="Codigo"
            value={form.codigo}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="responsable"
            placeholder="Responsable"
            value={form.responsable}
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
          <input
            type="text"
            name="observacion"
            placeholder="Observacion"
            value={form.observacion}
            onChange={handleChange}
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

export default InventoryEntryModal;