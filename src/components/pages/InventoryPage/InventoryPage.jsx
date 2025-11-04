import React, { useState, useEffect } from 'react';
import InventoryTable from './components/InventoryTable';
import InventoryForm from './components/InventoryForm';
import InventoryFilters from './components/InventoryFilters';
import './InventoryPage.css';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    const storedItems = [
      { id: 1, name: 'Fertilizante A', category: 'Fertilizante', stock: 20 },
      { id: 2, name: 'Semillas de Maíz', category: 'Semillas', stock: 100 },
    ];
    setItems(storedItems);
    setFilteredItems(storedItems);
  }, []);

  const handleAddOrUpdate = (item) => {
    let updatedItems;
    if (item.id) {
      updatedItems = items.map((i) => (i.id === item.id ? item : i));
    } else {
      updatedItems = [...items, { ...item, id: Date.now() }];
    }
    setItems(updatedItems);
    setFilteredItems(
      updatedItems.filter((i) =>
        i.name.toLowerCase().includes(filterTerm.toLowerCase())
      )
    );
    setSelectedItem(null);
  };

  const handleDelete = (id) => {
    const updatedItems = items.filter((i) => i.id !== id);
    setItems(updatedItems);
    setFilteredItems(
      updatedItems.filter((i) =>
        i.name.toLowerCase().includes(filterTerm.toLowerCase())
      )
    );
  };

  const handleFilter = (term) => {
    setFilterTerm(term);
    setFilteredItems(
      items.filter((i) =>
        i.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <div className="inventory-page">
      <h1>Gestión de Inventario</h1>
      <InventoryFilters onFilter={handleFilter} />
      <InventoryForm onSave={handleAddOrUpdate} selectedItem={selectedItem} />
      <InventoryTable
        items={filteredItems}
        onEdit={setSelectedItem}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default InventoryPage;
