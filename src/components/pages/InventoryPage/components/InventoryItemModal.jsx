import React, { useEffect, useState } from 'react';
import insumosService from '../../../../services/insumosService';

const InventoryItemModal = ({ open, selectedItem, onCancel, onSave }) => {
  const [form, setForm] = useState({ id_insumo: '', cantidad: 0, unidad: '', ultima_fecha: '' });
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    insumosService
      .getInsumos(1, 200)
      .then((list) => setInsumos(list))
      .catch((e) => setError(e?.message || 'Error al cargar insumos'))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (selectedItem) {
      setForm({
        id_insumo: selectedItem.id_insumo ?? selectedItem.insumoId ?? '',
        cantidad: Number(selectedItem.cantidad ?? 0),
        unidad: selectedItem.unidad ?? '',
        ultima_fecha: selectedItem.ultima_fecha ?? '',
      });
    } else {
      setForm({ id_insumo: '', cantidad: 0, unidad: '', ultima_fecha: '' });
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

  if (!open) return null;

  return (
    <div className="inventory-modal-backdrop" onClick={onCancel}>
      <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{selectedItem ? 'Actualizar item' : 'Agregar item'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Insumo</label>
            <select
              name="id_insumo"
              value={form.id_insumo}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                {loading ? 'Cargando insumos...' : 'Seleccione un insumo'}
              </option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
            {error && <small style={{ color: 'red' }}>{error}</small>}
          </div>
          <input
            type="number"
            name="cantidad"
            placeholder="Cantidad"
            value={form.cantidad}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="unidad"
            placeholder="Unidad"
            value={form.unidad}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="ultima_fecha"
            placeholder="Última fecha"
            value={form.ultima_fecha}
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

export default InventoryItemModal;