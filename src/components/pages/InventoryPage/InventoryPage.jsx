import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField, Typography, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import { Add, Search as SearchIcon, ArrowDownward, ArrowUpward, Delete, Edit } from '@mui/icons-material';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import InventoryTable from './components/InventoryTable';
// (Revert) InsumosTable removido
import InventoryItemModal from './components/InventoryItemModal';
import InventoryMovementModal from './components/InventoryMovementModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import inventoryService from '../../../services/inventoryService';
import insumosService from '../../../services/insumosService';
import movimientosService from '../../../services/movimientosService';
import categoriasService from '../../../services/categoriasService';
import almacenesService from '../../../services/almacenesService';
import './InventoryPage.css';

const InventoryPage = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openMovementModal, setOpenMovementModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [filterTerm, setFilterTerm] = useState('');
  const alert = useAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin || isInstructor;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getItems(1, 10),
    keepPreviousData: true,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStock(10),
    staleTime: 30 * 1000,
  });



  const { data: movimientosData, isError: movimientosError, isFetching: movimientosFetching } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => movimientosService.getMovimientos({}, 1, 100),
    retry: 0,
  });

  // Datos para selects de Categoría y Almacén en “Nuevo Insumo”
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'inventory-page'],
    queryFn: () => categoriasService.getCategorias(1, 100),
    staleTime: 60 * 1000,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes', 'inventory-page'],
    queryFn: () => almacenesService.getAlmacenes(1, 100),
    staleTime: 60 * 1000,
  });

  // (Revert) Consulta de insumos removida

  const items = data?.items || [];
  const movimientosEnabled = !!movimientosData?.items && !movimientosError;
  const stockByInsumo = useMemo(() => {
    if (!movimientosEnabled) return {};
    const acc = {};
    (movimientosData.items || []).forEach((m) => {
      const id = m.id_insumo;
      if (!acc[id]) acc[id] = 0;
      if (m.tipo_movimiento === 'entrada') acc[id] += Number(m.cantidad || 0);
      else if (m.tipo_movimiento === 'salida') acc[id] -= Number(m.cantidad || 0);
    });
    return acc;
  }, [movimientosEnabled, movimientosData]);

  const getStockStatus = (cantidad) => {
    const qty = Number(cantidad || 0);
    if (qty <= 1) return 'stock-danger';
    if (qty <= 5) return 'stock-warning';
    return 'stock-ok';
  };

  const displayItems = useMemo(() => {
    const enriched = items.map((i) => {
      const rawCantidad = movimientosEnabled ? Number(stockByInsumo[i.insumoId] ?? i.cantidad) : i.cantidad;
      const computedCantidad = Math.max(0, Number(rawCantidad || 0));
      return { ...i, cantidad: computedCantidad, stockStatus: getStockStatus(computedCantidad) };
    });
    if (!filterTerm) return enriched;
    return enriched.filter(i => (
      String(i.nombre).toLowerCase().includes(filterTerm.toLowerCase()) ||
      String(i.unidad).toLowerCase().includes(filterTerm.toLowerCase())
    ));
  }, [items, filterTerm, movimientosEnabled, stockByInsumo]);

  const createMutation = useMutation({
    mutationFn: inventoryService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setSelectedItem(null);
      alert.success('¡Éxito!', 'Insumo creado correctamente.');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el elemento'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setSelectedItem(null);
      alert.success('¡Éxito!', 'Insumo actualizado correctamente.');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo actualizar el elemento'),
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      alert.success('Inventario', 'Elemento eliminado correctamente');
      setItemToDelete(null);
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo eliminar el insumo'),
  });



  const [refreshingMovs, setRefreshingMovs] = useState(false);

  const createMovimientoMutation = useMutation({
    mutationFn: movimientosService.createMovimiento,
    onSuccess: async () => {
      setRefreshingMovs(true);
      await Promise.all([
        queryClient.invalidateQueries(['movimientos']),
        queryClient.invalidateQueries(['inventory']),
        queryClient.invalidateQueries(['inventory', 'low-stock']),
      ]);
      setRefreshingMovs(false);
      alert.success('Inventario', 'Movimiento registrado correctamente');
    },
    onError: (e) => alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo registrar el movimiento'),
  });

  const deleteMovimientoMutation = useMutation({
    mutationFn: (id) => movimientosService.deleteMovimiento(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(['movimientos']),
        queryClient.invalidateQueries(['inventory']),
        queryClient.invalidateQueries(['inventory', 'low-stock']),
      ]);
      alert.success('Inventario', 'Movimiento eliminado correctamente');
    },
    onError: (e) => alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo eliminar el movimiento'),
  });

  const handleDeleteMovimiento = (mov) => {
    if (!canDelete) { alert.error('Permisos', 'No tienes permisos para eliminar movimientos'); return; }
    if (!mov?.id) { alert.error('Error', 'Movimiento inválido'); return; }
    deleteMovimientoMutation.mutate(mov.id);
  };

  const [movementToEdit, setMovementToEdit] = useState(null);
  const updateMovimientoMutation = useMutation({
    mutationFn: ({ id, data }) => movimientosService.updateMovimiento(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(['movimientos']),
        queryClient.invalidateQueries(['inventory']),
        queryClient.invalidateQueries(['inventory', 'low-stock']),
      ]);
      alert.success('Inventario', 'Movimiento actualizado correctamente');
    },
    onError: (e) => alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo actualizar el movimiento'),
  });

  const effectSign = (tipo) => (String(tipo).toLowerCase() === 'salida' ? -1 : 1);
  const adjustInventoryForEdit = (original, updated) => {
    // Ajustar inventario por diferencia de efectos
    const origSign = effectSign(original.tipo_movimiento);
    const newSign = effectSign(updated.tipo_movimiento);
    const origInsumoId = Number(original.id_insumo);
    const newInsumoId = Number(updated.id_insumo);
    const origQty = Number(original.cantidad || 0);
    const newQty = Number(updated.cantidad || 0);

    const itemOrig = items.find((it) => Number(it.insumoId) === origInsumoId);
    const itemNew = items.find((it) => Number(it.insumoId) === newInsumoId);

    if (origInsumoId === newInsumoId) {
      const delta = (newSign * newQty) - (origSign * origQty);
      if (delta !== 0 && itemOrig) {
        const nuevaCantidad = Number(itemOrig.cantidad || 0) + delta;
        if (nuevaCantidad < 0) {
          alert.error('Validación', 'La edición produciría stock negativo');
          return false;
        }
        updateMutation.mutate({ id: itemOrig.id, data: { cantidad: nuevaCantidad, unidad: updated.unidad_medida, ultima_fecha: updated.fecha_movimiento } });
      }
      return true;
    } else {
      // Revertir efecto original en su insumo
      if (itemOrig) {
        const revertDelta = -(origSign * origQty);
        const nuevaCantidadOrig = Number(itemOrig.cantidad || 0) + revertDelta;
        if (nuevaCantidadOrig < 0) {
          alert.error('Validación', 'La reversión produce stock negativo');
          return false;
        }
        updateMutation.mutate({ id: itemOrig.id, data: { cantidad: nuevaCantidadOrig, unidad: original.unidad_medida, ultima_fecha: updated.fecha_movimiento } });
      }
      // Aplicar nuevo efecto en nuevo insumo
      const applyDelta = newSign * newQty;
      if (itemNew) {
        const nuevaCantidadNew = Number(itemNew.cantidad || 0) + applyDelta;
        if (nuevaCantidadNew < 0) {
          alert.error('Validación', 'La edición produciría stock negativo en el nuevo insumo');
          return false;
        }
        updateMutation.mutate({ id: itemNew.id, data: { cantidad: nuevaCantidadNew, unidad: updated.unidad_medida, ultima_fecha: updated.fecha_movimiento } });
      } else {
        if (applyDelta < 0) {
          alert.error('Validación', 'No existe inventario para disminuir en el nuevo insumo');
          return false;
        }
        createMutation.mutate({ id_insumo: newInsumoId, cantidad: applyDelta, unidad: updated.unidad_medida, ultima_fecha: updated.fecha_movimiento });
      }
      return true;
    }
  };

  const handleAddOrUpdate = async (formData) => {
    // Actualización de inventario existente
    if (selectedItem?.id) {
      if (!canEdit) { alert.error('Permisos', 'No tienes permisos para editar inventario'); return; }
      updateMutation.mutate({ id: selectedItem.id, data: formData });
      return;
    }

    if (!canCreate) { alert.error('Permisos', 'No tienes permisos para crear inventario'); return; }
    if (formData?.id_insumo) {
      createMutation.mutate(formData);
      return;
    }

    if (formData?.nombre) {
      try {
        const hoy = new Date();
        const obsSanitized = (() => {
          const raw = formData.observacion ?? 'Nuevo insumo';
          const s = String(raw).trim().slice(0, 50);
          return s.length ? s : 'N/A';
        })();
        const nuevoInsumo = await insumosService.createInsumo({
          nombre_insumo: String(formData.nombre || '').trim(),
          codigo: `GEN-${Date.now()}`,
          fecha_entrada: formData.ultima_fecha || hoy,
          observacion: obsSanitized,
          id_categoria: formData.id_categoria,
          id_almacen: formData.id_almacen,
        });

        await inventoryService.createItem({
          id_insumo: nuevoInsumo.id ?? nuevoInsumo.id_insumo,
          cantidad: Number(formData.cantidad || 0),
          unidad: formData.unidad,
          ultima_fecha: formData.ultima_fecha || nuevoInsumo.raw?.fecha_entrada || hoy,
        });

        await queryClient.invalidateQueries(['inventory']);
        alert.success('¡Éxito!', 'Insumo creado y agregado al inventario.');
      } catch (e) {
        const serverMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message;
        alert.error('Error', serverMsg || 'No se pudo crear el insumo o el inventario');
      }
      return;
    }

    alert.error('Validación', 'Debes indicar el nombre del insumo o seleccionar uno.');
  };

  const handleOpenConfirmDelete = (item) => {
    if (!canDelete) { alert.error('Permisos', 'No tienes permisos para eliminar inventario'); return; }
    setItemToDelete(item);
    setOpenConfirmModal(true);
  };



  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setOpenConfirmModal(false);
    }
  };

  const handleNuevoInsumo = () => {
    if (!canCreate) { alert.error('Permisos', 'No tienes permisos para crear inventario'); return; }
    setSelectedItem(null);
    setOpenItemModal(true);
  };

  // Eliminado: botón de nuevo movimiento ya no se usa

  if (isLoading) {
    return (
      <div className="loading-container">
        <CircularProgress />
        <Typography>Cargando inventario...</Typography>
      </div>
    );
  }

  if (isError) {
    return <Typography color="error">Error al cargar el inventario.</Typography>;
  }

  return (
    <div className="dashboard-content">
      <div className="inventory-page">
        <div className="container-header">
          <h1 className="page-title">Gestión de Inventario</h1>
          <div className="header-actions">
            {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNuevoInsumo}
              className="new-inventory-button"
            >
              Nuevo Insumo
            </Button>
            )}
            {/* Botón de nuevo movimiento eliminado por requerimiento */}
          </div>
        </div>

       

        <div className="search-container">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre o unidad..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              className: 'search-input'
            }}
          />
        </div>
        <InventoryTable
          items={displayItems}
          onEdit={(item) => { setSelectedItem(item); setOpenItemModal(true); }}
          onDelete={handleOpenConfirmDelete}
          onQuickEntrada={(item) => {
            setMovementToEdit({ id_insumo: item.insumoId, tipo_movimiento: 'entrada', unidad: item.unidad });
            setOpenMovementModal(true);
          }}
          onQuickSalida={(item) => {
            setMovementToEdit({ id_insumo: item.insumoId, tipo_movimiento: 'salida', unidad: item.unidad });
            setOpenMovementModal(true);
          }}
        />

        {/* (Revert) Sección Registro de Insumos eliminada */}

        <InventoryItemModal
          open={openItemModal}
          selectedItem={selectedItem}
          onCancel={() => { setOpenItemModal(false); setSelectedItem(null); }}
          onSave={(values) => { handleAddOrUpdate(values); setOpenItemModal(false); setSelectedItem(null); }}
          categorias={Array.isArray(categorias?.items) ? categorias.items : (Array.isArray(categorias) ? categorias : [])}
          almacenes={Array.isArray(almacenes?.items) ? almacenes.items : (Array.isArray(almacenes) ? almacenes : [])}
        />

        <InventoryMovementModal
          open={openMovementModal}
          movement={movementToEdit}
          onCancel={() => { setOpenMovementModal(false); setMovementToEdit(null); }}
          onSave={(mov) => {
            const itemMatch = items.find((it) => Number(it.insumoId) === Number(mov.id_insumo));
            const cantidad = Number(mov.cantidad || 0);
            if (cantidad <= 0) {
              alert.error('Validación', 'La cantidad debe ser mayor a 0');
              return;
            }
            if (movementToEdit?.id) {
              const ok = adjustInventoryForEdit(movementToEdit, mov);
              if (!ok) return;
              updateMovimientoMutation.mutate({ id: movementToEdit.id, data: mov });
            } else {
              // Registrar nuevo movimiento y ajustar inventario
              createMovimientoMutation.mutate({
                id_insumo: mov.id_insumo,
                tipo_movimiento: mov.tipo_movimiento,
                cantidad: mov.cantidad,
                unidad_medida: mov.unidad_medida,
                fecha_movimiento: mov.fecha_movimiento,
                responsable: mov.responsable,
                observacion: mov.observacion,
              });
              if (mov.tipo_movimiento === 'salida') {
                if (!itemMatch) { alert.error('Validación', 'No se encontró el insumo en inventario'); return; }
                const nuevaCantidad = Number(itemMatch.cantidad || 0) - cantidad;
                if (nuevaCantidad < 0) { alert.error('Validación', 'La salida excede el stock disponible'); return; }
                updateMutation.mutate({ id: itemMatch.id, data: { cantidad: nuevaCantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento } });
              } else if (mov.tipo_movimiento === 'entrada') {
                if (itemMatch) {
                  const nuevaCantidad = Number(itemMatch.cantidad || 0) + cantidad;
                  updateMutation.mutate({ id: itemMatch.id, data: { cantidad: nuevaCantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento } });
                } else {
                  createMutation.mutate({ id_insumo: mov.id_insumo, cantidad: cantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento });
                }
              }
            }
            setOpenMovementModal(false);
            setMovementToEdit(null);
          }}
        />



        {/* Tablas de movimientos: Entradas y Salidas */}
        <div className="users-table-container" style={{ marginTop: 8 }}>
          {(movimientosFetching || refreshingMovs) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Actualizando movimientos…</Typography>
            </div>
          )}
          <div className="section-header entradas">
            <Typography variant="h6" className="section-title section-title--entrada">Entradas</Typography>
          </div>
          <Table className="inventory-table">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Insumo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Almacén</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {((movimientosData?.items || []).filter(m => m.tipo_movimiento === 'entrada')).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">Sin entradas registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (movimientosData?.items || [])
                  .filter(m => m.tipo_movimiento === 'entrada')
                  .map((m) => {
                    const itemMatch = items.find((it) => Number(it.insumoId) === Number(m.id_insumo));
                    const nombre = itemMatch?.nombre || `#${m.id_insumo}`;
                    const categoria = m.insumo_categoria || itemMatch?.categoria || itemMatch?.raw?.insumo?.id_categoria?.nombre || '-';
                    const almacen = m.insumo_almacen || itemMatch?.almacen || itemMatch?.raw?.insumo?.id_almacen?.nombre_almacen || '-';
                    const fecha = m.fecha_movimiento ? new Date(m.fecha_movimiento) : null;
                    const fechaStr = fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleString() : '-';
                    return (
                      <TableRow key={`entrada-${m.id}`}>
                        <TableCell>{fechaStr}</TableCell>
                        <TableCell>{nombre}</TableCell>
                        <TableCell>{categoria}</TableCell>
                        <TableCell>{almacen}</TableCell>
                        <TableCell>{m.cantidad}</TableCell>
                        <TableCell>{m.unidad_medida}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                            onClick={() => handleDeleteMovimiento(m)}
                            className="action-button delete-button"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Editar movimiento"
                            aria-label="Editar movimiento"
                            onClick={() => { setMovementToEdit(m); setOpenMovementModal(true); }}
                            className="action-button edit-button"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="users-table-container" style={{ marginTop: 8 }}>
          <div className="section-header salidas">
            <Typography variant="h6" className="section-title section-title--salida">Salidas</Typography>
          </div>
          <Table className="inventory-table">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Insumo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Almacén</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {((movimientosData?.items || []).filter(m => m.tipo_movimiento === 'salida')).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">Sin salidas registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (movimientosData?.items || [])
                  .filter(m => m.tipo_movimiento === 'salida')
                  .map((m) => {
                    const itemMatch = items.find((it) => Number(it.insumoId) === Number(m.id_insumo));
                    const nombre = itemMatch?.nombre || `#${m.id_insumo}`;
                    const categoria = m.insumo_categoria || itemMatch?.categoria || itemMatch?.raw?.insumo?.id_categoria?.nombre || '-';
                    const almacen = m.insumo_almacen || itemMatch?.almacen || itemMatch?.raw?.insumo?.id_almacen?.nombre_almacen || '-';
                    const fecha = m.fecha_movimiento ? new Date(m.fecha_movimiento) : null;
                    const fechaStr = fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleString() : '-';
                    return (
                      <TableRow key={`salida-${m.id}`}>
                        <TableCell>{fechaStr}</TableCell>
                        <TableCell>{nombre}</TableCell>
                        <TableCell>{categoria}</TableCell>
                        <TableCell>{almacen}</TableCell>
                        <TableCell>{m.cantidad}</TableCell>
                        <TableCell>{m.unidad_medida}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                            onClick={() => handleDeleteMovimiento(m)}
                            className="action-button delete-button"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Editar movimiento"
                            aria-label="Editar movimiento"
                            onClick={() => { setMovementToEdit(m); setOpenMovementModal(true); }}
                            className="action-button edit-button"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Confirmación para eliminar registro de inventario */}
        <ConfirmModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Eliminar del Inventario"
          message={`¿Eliminar el registro de inventario de "${itemToDelete?.nombre}"? No afectará el Insumo base.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          loading={deleteMutation.isLoading}
        />


      </div>
    </div>
  );
};

export default InventoryPage;
