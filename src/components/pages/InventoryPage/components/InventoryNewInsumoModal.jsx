import React, { useEffect, useState } from 'react';

const InventoryNewInsumoModal = ({ open, onCancel, onSave }) => {
  const [form, setForm] = useState({ nombre: '', codigo: '', id: '', unidad: '', fecha: '' });

  useEffect(() => {
    if (!open) {
      setForm({ nombre: '', codigo: '', id: '', unidad: '', fecha: '' });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  if (!open) return null;

  return (
    <div className="inventory-modal-backdrop" onClick={onCancel}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Nuevo insumo</h2>
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
            name="codigo"
            placeholder="Codigo"
            value={form.codigo}
            onChange={handleChange}
          />
          <input
            type="text"
            name="id"
            placeholder="ID"
            value={form.id}
            onChange={handleChange}
          />
          <input
            type="text"
            name="unidad"
            placeholder="Unidad(ej:litro,unidas)"
            value={form.unidad}
            onChange={handleChange}
          />
          <input
            type="date"
            name="fecha"
            placeholder="DD/MM/AAAA"
            value={form.fecha}
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

export default InventoryNewInsumoModal;