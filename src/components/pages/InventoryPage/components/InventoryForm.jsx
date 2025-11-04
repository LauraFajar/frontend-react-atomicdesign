import React, { useState, useEffect } from 'react';

const InventoryForm = ({ onSave, selectedItem }) => {
  const [form, setForm] = useState({ name: '', category: '', stock: 0 });

  useEffect(() => {
    if (selectedItem) setForm(selectedItem);
  }, [selectedItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setForm({ name: '', category: '', stock: 0 });
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="category"
        placeholder="Categoría"
        value={form.category}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="stock"
        placeholder="Cantidad"
        value={form.stock}
        onChange={handleChange}
        required
      />
      <button type="submit">
        {selectedItem ? 'Actualizar' : 'Agregar'}
      </button>
    </form>
  );
};

export default InventoryForm;
