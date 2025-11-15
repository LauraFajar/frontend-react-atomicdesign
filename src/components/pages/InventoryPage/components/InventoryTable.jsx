import React from 'react';
import { Edit, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
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

const InventoryTable = ({ items, onEdit, onDelete, onQuickEntrada, onQuickSalida }) => {
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
            <TableRow key={item.id} hover className={`stock-row ${item.stockStatus || ''}`}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell>{item.categoria || '-'}</TableCell>
              <TableCell>{item.almacen || '-'}</TableCell>
              <TableCell className={`quantity-cell ${item.stockStatus || ''}`}>
                <span className={`stock-badge ${item.stockStatus || ''}`}>
                  {Math.max(0, Number(item.cantidad || 0))}
                </span>
              </TableCell>
              <TableCell>{item.unidad}</TableCell>
              <TableCell>{item.ultima_fecha || '-'}</TableCell>
              <TableCell align="right">
                {typeof onEdit === 'function' && (
                  <IconButton title="Editar inventario" aria-label="Editar inventario" onClick={() => onEdit(item)} className="action-button edit-button">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
                {typeof onQuickEntrada === 'function' && (
                  <IconButton title="Registrar entrada" aria-label="Registrar entrada" onClick={() => onQuickEntrada(item)} className="action-button entrada-button">
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                )}
                {typeof onQuickSalida === 'function' && (
                  <IconButton title="Registrar salida" aria-label="Registrar salida" onClick={() => onQuickSalida(item)} className="action-button salida-button">
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                )}
                {typeof onDelete === 'function' && (
                  <IconButton title="Eliminar inventario" aria-label="Eliminar inventario" onClick={() => onDelete(item)} className="action-button delete-button">
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InventoryTable;
