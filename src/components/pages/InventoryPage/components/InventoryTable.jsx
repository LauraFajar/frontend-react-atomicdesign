import React from 'react';

const InventoryTable = ({ items, onEdit, onDelete }) => {
  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Unidad</th>
          <th>Última fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{item.nombre}</td>
            <td>{item.cantidad}</td>
            <td>{item.unidad}</td>
            <td>{item.ultima_fecha || '-'}</td>
            <td>
              <button className="btn-update" onClick={() => onEdit(item)}>Actualizar</button>
              <button className="btn-delete" onClick={() => onDelete(item.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;
