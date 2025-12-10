import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField, Typography, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Pagination } from '@mui/material';
import { Add, Search as SearchIcon, Delete, Edit } from '@mui/icons-material';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import InventoryTable from './components/InventoryTable';
import InventoryItemModal from './components/InventoryItemModal';
import InventoryMovementModal from './components/InventoryMovementModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import inventoryService from '../../../services/inventoryService';
import insumosService from '../../../services/insumosService';
import movimientosService from '../../../services/movimientosService';
import categoriasService from '../../../services/categoriasService';
import almacenesService from '../../../services/almacenesService';
import financeService from '../../../services/financeService';
import './InventoryPage.css';

const InventoryPage = () => {
  const { user, hasAnyPermission, permissions, refreshPermissions } = useAuth();
  const [selectedItem, setSelectedItem] = useState(null);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openConfirmMovModal, setOpenConfirmMovModal] = useState(false);
  const [openMovementModal, setOpenMovementModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [movementToDelete, setMovementToDelete] = useState(null);
  
  const [entradasPage, setEntradasPage] = useState(0);
  const [entradasRowsPerPage, setEntradasRowsPerPage] = useState(10);
  const [salidasPage, setSalidasPage] = useState(0);
  const [salidasRowsPerPage, setSalidasRowsPerPage] = useState(10);
  
  const [filterTerm, setFilterTerm] = useState('');
  const alert = useAlert();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const permisosVer = ['inventario:ver','insumos:ver','inventario:listar'];
  const permisosCrear = ['inventario:crear','insumos:crear'];
  const permisosEditar = ['inventario:editar','insumos:editar'];
  const permisosEliminar = ['inventario:eliminar','insumos:eliminar'];
  const permisosMovimientos = ['inventario:movimientos','movimientos:crear','inventario:entrada','inventario:salida'];

  const canView = isAdmin || isInstructor || hasAnyPermission(permisosVer);
  const canCreate = isAdmin || hasAnyPermission(permisosCrear);
  const canEdit = isAdmin || hasAnyPermission(permisosEditar);
  const canDelete = isAdmin || hasAnyPermission(permisosEliminar);
  const canMovements = isAdmin || hasAnyPermission(permisosMovimientos);

  useEffect(() => {
    if (user?.id) {
      refreshPermissions(user.id);
    }
  }, [user?.id, refreshPermissions]);

  useEffect(() => {
    console.log('[InventoryPage] user:', user);
    console.log('[InventoryPage] permissions:', permissions);
    console.log('[InventoryPage] flags:', { canView, canCreate, canEdit, canDelete, canMovements, isAdmin, isInstructor });
  }, [user, permissions, canView, canCreate, canEdit, canDelete, canMovements, isAdmin, isInstructor]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getItems(1, 10),
    keepPreviousData: true,
    enabled: canView,
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
    enabled: canView,
  });

  const { data: salidasData, isError: salidasError, isFetching: salidasFetching } = useQuery({
    queryKey: ['salidas'],
    queryFn: () => financeService.getSalidas({}), 
    retry: 0,
    enabled: canView,
  });

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

  const { data: insumosList = [] } = useQuery({
    queryKey: ['insumos', 'inventory-page'],
    queryFn: () => insumosService.getInsumos(1, 1000),
    staleTime: 60 * 1000,
  });

  const mapSalida = (s) => {
    const rawInsumo = s.insumo;
    
    let categoriaId = null;
    let almacenId = null;
    
    if (typeof rawInsumo === 'object') {
      categoriaId = rawInsumo?.id_categoria?.id ?? 
                   rawInsumo?.id_categoria?.id_categoria ?? 
                   rawInsumo?.id_categoria;
      almacenId = rawInsumo?.id_almacen?.id ?? 
                 rawInsumo?.id_almacen?.id_almacen ?? 
                 rawInsumo?.id_almacen;
    } else {
      categoriaId = s.id_categoria;
      almacenId = s.id_almacen;
    }
    
    return {
      id: s.id_salida,
      id_insumo: Number(rawInsumo?.id_insumo || s.id_insumo || s.cultivo?.id_insumo || 0),
      nombre: rawInsumo?.nombre_insumo || s.nombre_insumo || `#${s.cultivo?.id_insumo || 0}`,
      tipo_movimiento: 'salida',
      cantidad: Number(s.cantidad || 0),
      unidad_medida: s.unidad_medida || '',
      fecha_movimiento: s.fecha_salida || null,
      observacion: s.observacion || '',
      insumo_categoria: typeof rawInsumo === 'object' ? (rawInsumo?.id_categoria?.nombre ?? '') : '',
      insumo_almacen: typeof rawInsumo === 'object' ? (rawInsumo?.id_almacen?.nombre_almacen ?? '') : '',
      id_categoria: categoriaId,
      id_almacen: almacenId,
      raw: s,
    };
  };

  const items = data?.items || [];
  const movimientosEnabled = !!movimientosData?.items && !movimientosError;
  const salidasEnabled = !!salidasData?.length && !salidasError; 
  const catNameById = useMemo(() => {
    const m = new Map();
    const list = Array.isArray(categorias?.items) ? categorias.items : (Array.isArray(categorias) ? categorias : []);
    list.forEach((c) => m.set(Number(c.id), c.nombre));
    return m;
  }, [categorias]);
  const almacenNameById = useMemo(() => {
    const m = new Map();
    const list = Array.isArray(almacenes?.items) ? almacenes.items : (Array.isArray(almacenes) ? almacenes : []);
    list.forEach((a) => m.set(Number(a.id), a.nombre_almacen || a.nombre));
    return m;
  }, [almacenes]);

  const insumoCatIdById = useMemo(() => {
    const m = new Map();
    const list = Array.isArray(insumosList) ? insumosList : [];
    list.forEach((ins) => {
      const rel = ins?.raw?.id_categoria ?? ins?.id_categoria;
      const id = typeof rel === 'object' ? (rel?.id_categoria ?? rel?.id ?? rel) : rel;
      if (id != null) m.set(Number(ins.id), Number(id));
    });
    return m;
  }, [insumosList]);

  const insumoAlmIdById = useMemo(() => {
    const m = new Map();
    const list = Array.isArray(insumosList) ? insumosList : [];
    list.forEach((ins) => {
      const rel = ins?.raw?.id_almacen ?? ins?.id_almacen;
      const id = typeof rel === 'object' ? (rel?.id_almacen ?? rel?.id ?? rel) : rel;
      if (id != null) m.set(Number(ins.id), Number(id));
    });
    return m;
  }, [insumosList]);
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

  const combinedSalidas = useMemo(() => {
    const manualSalidas = (movimientosData?.items || []).filter(m => m.tipo_movimiento === 'salida');
    const autoSalidas = (salidasData || []).map(mapSalida);
    return [...manualSalidas, ...autoSalidas].sort((a, b) => {
      const dateA = new Date(a.fecha_movimiento || a.fecha_salida);
      const dateB = new Date(b.fecha_movimiento || b.fecha_salida);
      return dateB.getTime() - dateA.getTime();
    });
  }, [movimientosData, salidasData]);

  const getStockStatus = (cantidad) => {
    const qty = Number(cantidad || 0);
    if (qty <= 1) return 'stock-danger';
    if (qty <= 5) return 'stock-warning';
    return 'stock-ok';
  };

  const displayItems = useMemo(() => {
    const enriched = items.map((i) => {
      const computedCantidad = Math.max(0, Number(i.cantidad || 0));
      const catId = i?.idCategoria ?? insumoCatIdById.get(Number(i.insumoId)) ?? (() => {
        const rc = i?.raw?.insumo?.id_categoria ?? i?.raw?.id_categoria;
        return typeof rc === 'object' ? Number(rc?.id ?? rc?.id_categoria) : Number(rc);
      })();
      const almId = i?.idAlmacen ?? insumoAlmIdById.get(Number(i.insumoId)) ?? (() => {
        const ra = i?.raw?.insumo?.id_almacen ?? i?.raw?.id_almacen;
        return typeof ra === 'object' ? Number(ra?.id ?? ra?.id_almacen) : Number(ra);
      })();
      const catName = i.categoria || (catId ? (catNameById.get(Number(catId)) || '') : '');
      const almName = i.almacen || (almId ? (almacenNameById.get(Number(almId)) || '') : '');
      return { ...i, cantidad: computedCantidad, stockStatus: getStockStatus(computedCantidad), categoria: catName, almacen: almName };
    });
    if (!filterTerm) return enriched;
    return enriched.filter(i => (
      String(i.nombre).toLowerCase().includes(filterTerm.toLowerCase()) ||
      String(i.unidad).toLowerCase().includes(filterTerm.toLowerCase())
    ));
  }, [items, filterTerm, catNameById, almacenNameById, insumoCatIdById, insumoAlmIdById]);

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
      if (itemOrig) {
        const revertDelta = -(origSign * origQty);
        const nuevaCantidadOrig = Number(itemOrig.cantidad || 0) + revertDelta;
        if (nuevaCantidadOrig < 0) {
          alert.error('Validación', 'La reversión produce stock negativo');
          return false;
        }
        updateMutation.mutate({ id: itemOrig.id, data: { cantidad: nuevaCantidadOrig, unidad: original.unidad_medida, ultima_fecha: updated.fecha_movimiento } });
      }
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
    if (selectedItem?.id) {
      if (!canEdit) { alert.error('Permisos', 'No tienes permisos para editar inventario'); return; }
      try {
        const invPayload = {
          cantidad: formData.cantidad,
          unidad: formData.unidad,
          ultima_fecha: formData.ultima_fecha,
        };
        const insumoId = Number(selectedItem.insumoId);
        const insumoPayload = {
          ...(formData.nombre ? { nombre_insumo: String(formData.nombre).trim() } : {}),
          ...(formData.observacion !== undefined ? { observacion: formData.observacion } : {}),
          ...(formData.id_categoria ? { id_categoria: Number(formData.id_categoria) } : {}),
          ...(formData.id_almacen ? { id_almacen: Number(formData.id_almacen) } : {}),
        };

        const requests = [];
        if (Object.values(invPayload).some(v => v !== undefined)) {
          requests.push(inventoryService.updateItem(selectedItem.id, invPayload));
        }
        if (insumoId && Object.keys(insumoPayload).length > 0) {
          requests.push(insumosService.updateInsumo(insumoId, insumoPayload));
        }
        await Promise.all(requests);
        await Promise.all([
          queryClient.invalidateQueries(['inventory']),
          queryClient.invalidateQueries(['insumos', 'inventory-page']),
        ]);
        setSelectedItem(null);
        alert.success('¡Éxito!', 'Elemento actualizado correctamente.');
      } catch (e) {
        alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo actualizar el elemento');
      }
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
          unidad_medida: formData.unidad,
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

  const handleOpenConfirmDeleteMovement = (mov) => {
    if (!canDelete) { alert.error('Permisos', 'No tienes permisos para eliminar movimientos'); return; }
    if (!mov?.id) { alert.error('Error', 'Movimiento inválido'); return; }
    setMovementToDelete(mov);
    setOpenConfirmMovModal(true);
  };

  const handleConfirmDeleteMovement = () => {
    if (movementToDelete?.id) {
      deleteMovimientoMutation.mutate(movementToDelete.id);
      setOpenConfirmMovModal(false);
      setMovementToDelete(null);
    }
  };

  const handleNuevoInsumo = () => {
    if (!canCreate) { alert.error('Permisos', 'No tienes permisos para crear inventario'); return; }
    setSelectedItem(null);
    setOpenItemModal(true);
    setTimeout(() => { const el = document.activeElement; if (el && typeof el.blur === 'function') { el.blur(); } }, 0);
  };

  const handleEntradasPageChange = (event, newPage) => {
    setEntradasPage(newPage - 1); 
  };

  const handleSalidasPageChange = (event, newPage) => {
    setSalidasPage(newPage - 1); 
  };

  const entradasData = (movimientosData?.items || []).filter(m => m.tipo_movimiento === 'entrada');
  const paginatedEntradas = entradasData.slice(
    entradasPage * entradasRowsPerPage,
    entradasPage * entradasRowsPerPage + entradasRowsPerPage
  );
  const entradasTotalPages = Math.ceil(entradasData.length / entradasRowsPerPage);

  const salidasForPagination = combinedSalidas;
  const paginatedSalidas = salidasForPagination.slice(
    salidasPage * salidasRowsPerPage,
    salidasPage * salidasRowsPerPage + salidasRowsPerPage
  );
  const salidasTotalPages = Math.ceil(salidasForPagination.length / salidasRowsPerPage);


  if (!canView) {
    return (
      <div className="loading-container">
        <Typography color="error">No tienes permisos para ver Inventario.</Typography>
      </div>
    );
  }

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
                disabled={!canCreate}
              >
                Nuevo Insumo
              </Button>
            )}
            
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
          onEdit={canEdit ? ((item) => { setSelectedItem(item); setOpenItemModal(true); }) : undefined}
          onDelete={canDelete ? handleOpenConfirmDelete : undefined}
          onQuickEntrada={canMovements ? ((item) => { setMovementToEdit({ id_insumo: item.insumoId, tipo_movimiento: 'entrada', unidad: item.unidad }); setOpenMovementModal(true); }) : undefined}
          onQuickSalida={canMovements ? ((item) => { setMovementToEdit({ id_insumo: item.insumoId, tipo_movimiento: 'salida', unidad: item.unidad }); setOpenMovementModal(true); }) : undefined}
        />


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
          onSave={async (mov) => {
            const itemMatch = items.find((it) => Number(it.insumoId) === Number(mov.id_insumo));
            const cantidad = Number(mov.cantidad || 0);
            if (cantidad <= 0) {
              alert.error('Validación', 'La cantidad debe ser mayor a 0');
              return;
            }
            try {
              if (movementToEdit?.id) {
                const ok = adjustInventoryForEdit(movementToEdit, mov);
                if (!ok) return;
                await movimientosService.updateMovimiento(movementToEdit.id, mov);
              } else {
                try {
                  await movimientosService.createMovimiento({
                    id_insumo: mov.id_insumo,
                    tipo_movimiento: mov.tipo_movimiento,
                    cantidad: mov.cantidad,
                    unidad_medida: mov.unidad_medida,
                    fecha_movimiento: mov.fecha_movimiento,
                    responsable: mov.responsable,
                    observacion: mov.observacion,
                    id_cultivo: mov.id_cultivo,
                    valor_unidad: mov.valor_unidad,
                  });
                } catch (e) {
                  const msg = e?.response?.data?.message || e.message || '';
                  const msgStr = Array.isArray(msg) ? msg.join(' ') : String(msg);
                  if (!/id_insumo should not exist/i.test(msgStr) && !/insumo should not exist/i.test(msgStr)) {
                    throw e;
                  }
                }
                if (mov.tipo_movimiento === 'salida') {
                  if (!itemMatch) { alert.error('Validación', 'No se encontró el insumo en inventario'); return; }
                  const nuevaCantidad = Number(itemMatch.cantidad || 0) - cantidad;
                  if (nuevaCantidad < 0) { alert.error('Validación', 'La salida excede el stock disponible'); return; }
                  await inventoryService.updateItem(itemMatch.id, { cantidad: nuevaCantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento });
                } else if (mov.tipo_movimiento === 'entrada') {
                  if (itemMatch) {
                    const nuevaCantidad = Number(itemMatch.cantidad || 0) + cantidad;
                    await inventoryService.updateItem(itemMatch.id, { cantidad: nuevaCantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento });
                  } else {
                    await inventoryService.createItem({ id_insumo: mov.id_insumo, cantidad: cantidad, unidad: mov.unidad_medida, ultima_fecha: mov.fecha_movimiento });
                  }
                }
              }
              await Promise.all([
                queryClient.invalidateQueries(['movimientos']),
                queryClient.invalidateQueries(['inventory']),
                queryClient.invalidateQueries(['inventory', 'low-stock']),
              ]);
              alert.success('Inventario', movementToEdit?.id ? 'Movimiento actualizado correctamente' : 'Movimiento registrado correctamente');
              setOpenMovementModal(false);
              setMovementToEdit(null);
            } catch (e) {
              alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo registrar/actualizar el movimiento');
            }
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
              {entradasData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">Sin entradas registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntradas
                  .map((m) => {
                    const nombre = m.nombre || `#${m.id_insumo}`; 
                    
                    let categoria = m.insumo_categoria || '-';
                    if (!categoria || categoria === '-') {
                      const catId = m.id_categoria || insumoCatIdById.get(Number(m.id_insumo));
                      if (catId) {
                        categoria = catNameById.get(Number(catId)) || '-';
                      }
                    }
                    
                    let almacen = m.insumo_almacen || '-';
                    if (!almacen || almacen === '-') {
                      const almId = m.id_almacen || insumoAlmIdById.get(Number(m.id_insumo));
                      if (almId) {
                        almacen = almacenNameById.get(Number(almId)) || '-';
                      }
                    }
                    
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
                            title="Editar movimiento"
                            aria-label="Editar movimiento"
                            onClick={() => { setMovementToEdit(m); setOpenMovementModal(true); }}
                            className="action-button edit-button"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                            onClick={() => handleOpenConfirmDeleteMovement(m)}
                            className="action-button delete-button"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          {entradasData.length > 0 && (
            <div className="pagination-container">
              <Pagination
                count={entradasTotalPages}
                page={entradasPage + 1}
                onChange={handleEntradasPageChange}
                color="primary"
              />
            </div>
          )}
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
              {combinedSalidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">Sin salidas registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSalidas.map((m) => {
                    let nombre = m.nombre;
                    if (!nombre || nombre === '' || nombre.startsWith('#')) {
                      const insumo = insumosList.find(ins => Number(ins.id) === Number(m.id_insumo));
                      if (insumo) {
                        nombre = insumo.nombre || `#${m.id_insumo}`;
                      } else {
                        console.log('Insumo no encontrado para salida:', {
                          id_insumo: m.id_insumo,
                          salidaId: m.id,
                          insumosDisponibles: insumosList.map(ins => ({ id: ins.id, nombre: ins.nombre }))
                        });
                      }
                    }
                    
                    let categoria = m.insumo_categoria || '-';
                    if (!categoria || categoria === '-') {
                      const catId = m.id_categoria || insumoCatIdById.get(Number(m.id_insumo));
                      if (catId) {
                        categoria = catNameById.get(Number(catId)) || '-';
                      }
                    }
                    
                    let almacen = m.insumo_almacen || '-';
                    if (!almacen || almacen === '-') {
                      const almId = m.id_almacen || insumoAlmIdById.get(Number(m.id_insumo));
                      if (almId) {
                        almacen = almacenNameById.get(Number(almId)) || '-';
                      }
                    }
                    
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
                            title="Editar movimiento"
                            aria-label="Editar movimiento"
                            onClick={() => { setMovementToEdit(m); setOpenMovementModal(true); }}
                            className="action-button edit-button"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                            onClick={() => handleOpenConfirmDeleteMovement(m)}
                            className="action-button delete-button"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          {combinedSalidas.length > 0 && (
            <div className="pagination-container">
              <Pagination
                count={salidasTotalPages}
                page={salidasPage + 1}
                onChange={handleSalidasPageChange}
                color="primary"
              />
            </div>
          )}
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

        <ConfirmModal
          isOpen={openConfirmMovModal}
          onClose={() => setOpenConfirmMovModal(false)}
          onConfirm={handleConfirmDeleteMovement}
          title="Eliminar Movimiento"
          message={`¿Eliminar el movimiento #${movementToDelete?.id} de ${movementToDelete?.tipo_movimiento}?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          loading={deleteMovimientoMutation.isLoading}
        />


      </div>
    </div>
  );
};

export default InventoryPage;
