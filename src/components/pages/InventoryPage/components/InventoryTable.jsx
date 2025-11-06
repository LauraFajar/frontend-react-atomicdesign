import React from 'react';
import { Edit, Delete } from '@mui/icons-material';

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
            <td className="actions-cell">
              <button className="icon-btn icon-edit" aria-label="Editar" onClick={() => onEdit(item)}>
                <Edit fontSize="small" />
              </button>
              <button className="icon-btn icon-delete" aria-label="Eliminar" onClick={() => onDelete(item.id)}>
                <Delete fontSize="small" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;
