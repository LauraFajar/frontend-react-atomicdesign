import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField, Typography, CircularProgress } from '@mui/material';
import { Add, Search as SearchIcon, CompareArrows } from '@mui/icons-material';
import { useAlert } from '../../../contexts/AlertContext';
import InventoryTable from './components/InventoryTable';
import InventoryItemModal from './components/InventoryItemModal';
import InventoryMovementModal from './components/InventoryMovementModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import inventoryService from '../../../services/inventoryService';
import insumosService from '../../../services/insumosService';
import movimientosService from '../../../services/movimientosService';
import './InventoryPage.css';

const InventoryPage = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openMovementModal, setOpenMovementModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filterTerm, setFilterTerm] = useState('');
  const alert = useAlert();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getItems(1, 10),
    keepPreviousData: true,
  });

  const { data: movimientosData, isError: movimientosError } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => movimientosService.getMovimientos({}, 1, 100),
    retry: 0,
  });

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
      const computedCantidad = movimientosEnabled ? Number(stockByInsumo[i.insumoId] ?? i.cantidad) : i.cantidad;
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

  const handleAddOrUpdate = async (formData) => {
    // Actualización de inventario existente
    if (selectedItem?.id) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
      return;
    }

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
    setSelectedItem(null);
    setOpenItemModal(true);
  };

  const handleNuevoMovimiento = () => {
    setOpenMovementModal(true);
  };

  const handleGuardarMovimiento = (mov) => {
    const itemMatch = items.find((it) => Number(it.insumoId) === Number(mov.id_insumo));
    const cantidad = Number(mov.cantidad || 0);
    if (cantidad <= 0) {
      alert.error('Validación', 'La cantidad debe ser mayor a 0');
      return;
    }

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
    setOpenMovementModal(false);
  };

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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNuevoInsumo}
              className="new-inventory-button"
            >
              Nuevo Insumo
            </Button>
            <Button
              variant="contained"
              startIcon={<CompareArrows />}
              onClick={handleNuevoMovimiento}
              className="new-movement-button"
            >
              Nuevo Movimiento
            </Button>
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
        />

        <InventoryItemModal
          open={openItemModal}
          selectedItem={selectedItem}
          onCancel={() => { setOpenItemModal(false); setSelectedItem(null); }}
          onSave={(values) => { handleAddOrUpdate(values); setOpenItemModal(false); setSelectedItem(null); }}
        />

        <InventoryMovementModal
          open={openMovementModal}
          onCancel={() => setOpenMovementModal(false)}
          onSave={handleGuardarMovimiento}
        />

        <ConfirmModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Insumo"
          message={`¿Estás seguro de que deseas eliminar el insumo "${itemToDelete?.nombre}"? Esta acción no se puede deshacer.`}
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
