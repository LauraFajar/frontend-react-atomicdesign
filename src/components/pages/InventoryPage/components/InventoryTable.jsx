import React from 'react';

const InventoryTable = ({ items, onEdit, onDelete }) => {
  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.category}</td>
            <td>{item.stock}</td>
            <td>
              <button onClick={() => onEdit(item)}>Editar</button>
              <button onClick={() => onDelete(item.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;
