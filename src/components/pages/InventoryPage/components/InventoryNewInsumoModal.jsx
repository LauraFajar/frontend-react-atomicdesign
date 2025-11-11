import React, { useEffect, useState } from 'react';

const InventoryNewInsumoModal = ({ open, onCancel, onSave, categorias = [], almacenes = [] }) => {
  const [form, setForm] = useState({ nombre: '', codigo: '', unidad: '', fecha_entrada: '', observacion: '', id_categoria: '', id_almacen: '' });

  useEffect(() => {
    if (!open) {
      setForm({ nombre: '', codigo: '', unidad: '', fecha_entrada: '', observacion: '', id_categoria: '', id_almacen: '' });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id_categoria: form.id_categoria ? Number(form.id_categoria) : undefined,
      id_almacen: form.id_almacen ? Number(form.id_almacen) : undefined,
    };
    onSave?.(payload);
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
            name="unidad"
            placeholder="Unidad(ej:litro,unidas)"
            value={form.unidad}
            onChange={handleChange}
          />
          <select
            name="id_categoria"
            value={form.id_categoria}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione categoría</option>
            {(categorias || []).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            name="id_almacen"
            value={form.id_almacen}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione almacén</option>
            {(almacenes || []).map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <input
            type="date"
            name="fecha_entrada"
            placeholder="DD/MM/AAAA"
            value={form.fecha_entrada}
            onChange={handleChange}
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

export default InventoryNewInsumoModal;