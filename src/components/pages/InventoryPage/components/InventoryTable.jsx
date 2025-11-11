import React from 'react';
import { Edit, Delete } from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';

const InventoryTable = ({ items, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper} className="inventory-table-container">
      <Table className="inventory-table">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Almacén</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>Unidad</TableCell>
            <TableCell>Última fecha</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell>{item.categoria || '-'}</TableCell>
              <TableCell>{item.almacen || '-'}</TableCell>
              <TableCell className={`quantity-cell ${item.stockStatus || ''}`}>{item.cantidad}</TableCell>
              <TableCell>{item.unidad}</TableCell>
              <TableCell>{item.ultima_fecha || '-'}</TableCell>
              <TableCell align="right">
                {/* Editar stock/unidad del inventario */}
                <IconButton title="Editar inventario" aria-label="Editar inventario" onClick={() => onEdit?.(item)} className="action-button edit-button">
                  <Edit fontSize="small" />
                </IconButton>
                {/* Eliminar registro de inventario */}
                <IconButton title="Eliminar inventario" aria-label="Eliminar inventario" onClick={() => onDelete?.(item)} className="action-button delete-button">
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InventoryTable;
