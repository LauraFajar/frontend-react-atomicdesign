import React, { useState } from 'react';

const InventoryFilters = ({ onFilter }) => {
  const [term, setTerm] = useState('');

  const handleSearch = (e) => {
    setTerm(e.target.value);
    onFilter(e.target.value);
  };

  return (
    <div className="inventory-filters">
      <input
        type="text"
        placeholder="Buscar producto..."
        value={term}
        onChange={handleSearch}
      />
    </div>
  );
};

export default InventoryFilters;
