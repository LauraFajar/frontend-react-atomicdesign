import React, { useState, useEffect } from 'react';
import insumosService from '../../../../services/insumosService';

const InventoryForm = ({ onSave, selectedItem }) => {
  const [form, setForm] = useState({ id_insumo: '', cantidad: 0, unidad: '', ultima_fecha: '' });
  const [insumos, setInsumos] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [errorInsumos, setErrorInsumos] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      setForm({
        id_insumo: selectedItem.id_insumo ?? selectedItem.insumoId ?? '',
        cantidad: selectedItem.cantidad || 0,
        unidad: selectedItem.unidad || '',
        ultima_fecha: selectedItem.ultima_fecha || '',
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    const fetchInsumos = async () => {
      setLoadingInsumos(true);
      setErrorInsumos(null);
      try {
        const list = await insumosService.getInsumos(1, 200);
        setInsumos(list);
      } catch (e) {
        setErrorInsumos(e?.message || 'Error al cargar insumos');
      } finally {
        setLoadingInsumos(false);
      }
    };
    fetchInsumos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setForm({ id_insumo: '', cantidad: 0, unidad: '', ultima_fecha: '' });
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <div>
        <label>Insumo</label>
        <select
          name="id_insumo"
          value={form.id_insumo}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            {loadingInsumos ? 'Cargando insumos...' : 'Seleccione un insumo'}
          </option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
            </option>
          ))}
        </select>
        {errorInsumos && <small style={{ color: 'red' }}>{errorInsumos}</small>}
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
      <button type="submit">
        {selectedItem ? 'Actualizar' : 'Agregar'}
      </button>
    </form>
  );
};

export default InventoryForm;
