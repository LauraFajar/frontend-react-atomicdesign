import React, { useEffect, useState, useRef } from 'react';

const InventoryNewInsumoModal = ({ open, onCancel, onSave, categorias = [], almacenes = [] }) => {
  const [form, setForm] = useState({ 
    nombre: '', 
    codigo: '', 
    unidad: '', 
    fecha_entrada: '', 
    observacion: '', 
    id_categoria: '', 
    id_almacen: '',
    es_herramienta: false,
    costo_compra: '',
    vida_util_horas: '',
    fecha_compra: ''
  });

  useEffect(() => {
    if (!open) {
      setForm({ 
        nombre: '', 
        codigo: '', 
        unidad: '', 
        fecha_entrada: '', 
        observacion: '', 
        id_categoria: '', 
        id_almacen: '',
        es_herramienta: false,
        costo_compra: '',
        vida_util_horas: '',
        fecha_compra: ''
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setForm((f) => ({ ...f, [name]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

  if (!open) return null;

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (open && firstInputRef.current) {
      try { firstInputRef.current.focus(); } catch {}
    }
  }, [open]);

  return (
    <div className="inventory-modal-backdrop" onClick={onCancel}>
      <div className="inventory-modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-insumo-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="nuevo-insumo-title" className="modal-title">Nuevo insumo</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            ref={firstInputRef}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
            <input
              type="checkbox"
              name="es_herramienta"
              id="es_herramienta"
              checked={form.es_herramienta}
              onChange={handleChange}
            />
            <label htmlFor="es_herramienta">Es herramienta/equipo</label>
          </div>

          {form.es_herramienta && (
            <>
              <input
                type="number"
                name="costo_compra"
                placeholder="Costo de compra"
                value={form.costo_compra}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
              <input
                type="number"
                name="vida_util_horas"
                placeholder="Vida útil (horas)"
                value={form.vida_util_horas}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
              <input
                type="date"
                name="fecha_compra"
                placeholder="Fecha de compra"
                value={form.fecha_compra}
                onChange={handleChange}
              />
            </>
          )}
          
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