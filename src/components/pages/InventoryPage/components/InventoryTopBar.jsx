import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../../../contexts/AlertContext';
import insumosService from '../../../../services/insumosService';
import categoriasService from '../../../../services/categoriasService';
import almacenesService from '../../../../services/almacenesService';
import inventoryService from '../../../../services/inventoryService';
import movimientosService from '../../../../services/movimientosService';
import InventoryEntryModal from './InventoryEntryModal';
import InventoryExitModal from './InventoryExitModal';
import InventoryNewInsumoModal from './InventoryNewInsumoModal';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const InventoryTopBar = ({
  onNewSalida,
  onNewEntrada,
  onNuevoInsumo,
  onSearch,
}) => {
  const [search, setSearch] = useState('');
  const [openEntrada, setOpenEntrada] = useState(false);
  const [openSalida, setOpenSalida] = useState(false);
  const [openNuevoInsumo, setOpenNuevoInsumo] = useState(false);
  const alert = useAlert();
  const queryClient = useQueryClient();

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos', 'topbar'],
    queryFn: () => insumosService.getInsumos(1, 100),
    staleTime: 60 * 1000,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'topbar'],
    queryFn: () => inventoryService.getItems(1, 100),
    staleTime: 60 * 1000,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'topbar'],
    queryFn: () => categoriasService.getCategorias(1, 100),
    staleTime: 60 * 1000,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes', 'topbar'],
    queryFn: () => almacenesService.getAlmacenes(1, 100),
    staleTime: 60 * 1000,
  });

  const items = inventoryData?.items || [];

  const stats = useMemo(() => {
    const totalInsumos = Array.isArray(insumos) ? insumos.length : 0;
    const unidades = new Set((insumos || []).map((i) => i.unidad).filter(Boolean));
    const lastUpdateRaw = items
      .map((i) => i.ultima_fecha)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
    return {
      totalInsumos,
      unidadesCount: unidades.size,
      lastUpdate: formatDate(lastUpdateRaw),
    };
  }, [insumos, items]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  const createEntradaMutation = useMutation({
    mutationFn: (payload) => movimientosService.createMovimiento(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(['movimientos']),
        queryClient.invalidateQueries(['inventory']),
        queryClient.invalidateQueries(['inventory', 'topbar']),
      ]);
      alert.success('Inventario', 'Entrada registrada correctamente');
      setOpenEntrada(false);
    },
    onError: (e) => alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo registrar la entrada'),
  });

  const handleGuardarEntrada = (data) => {
    const codigo = String(data.codigo).trim();
    const nombreLower = String(data.nombre).toLowerCase();
    const insumoMatch = (insumos || []).find(
      (i) => String(i.id) === codigo || String(i.nombre).toLowerCase() === nombreLower
    );
    if (!insumoMatch) {
      alert.error('Validación', 'Selecciona un insumo válido (por nombre o código)');
      return;
    }
    const payload = {
      id_insumo: insumoMatch.id,
      tipo_movimiento: 'Entrada',
      cantidad: 1,
      unidad_medida: insumoMatch.unidad || 'unidad',
      fecha_movimiento: data.fecha,
    };
    createEntradaMutation.mutate(payload);
  };

  const createInsumoMutation = useMutation({
    mutationFn: (payload) => insumosService.createInsumo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['insumos']);
      queryClient.invalidateQueries(['insumos', 'topbar']);
      alert.success('Inventario', 'Insumo creado correctamente');
      setOpenNuevoInsumo(false);
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el insumo'),
  });

  const handleGuardarNuevoInsumo = (data) => {
    const payload = {
      nombre: data.nombre,
      unidad: data.unidad,
      codigo: data.codigo,
      fecha_entrada: data.fecha_entrada ?? data.fecha,
      observacion: data.observacion,
      id_categoria: data.id_categoria ?? undefined,
      id_almacen: data.id_almacen ?? undefined,
    };
    createInsumoMutation.mutate(payload);
  };

  const updateSalidaMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['inventory', 'topbar']);
      alert.success('Inventario', 'Salida registrada correctamente');
      setOpenSalida(false);
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo registrar la salida'),
  });

  const handleGuardarSalida = (data) => {
    const nombreLower = String(data.nombre).toLowerCase();
    const cantidad = Number(data.cantidad || 0);
    if (cantidad <= 0) {
      alert.error('Validación', 'La cantidad debe ser mayor a 0');
      return;
    }
    const itemMatch = (items || []).find(
      (it) => String(it.nombre).toLowerCase() === nombreLower
    );
    if (!itemMatch) {
      alert.error('Validación', 'No se encontró el insumo en inventario');
      return;
    }

    const nuevaCantidad = Number(itemMatch.cantidad || 0) - cantidad;
    if (nuevaCantidad < 0) {
      alert.error('Validación', 'La salida excede el stock disponible');
      return;
    }

    const payload = {
      cantidad: nuevaCantidad,
      unidad: data.unidad || itemMatch.unidad,
      ultima_fecha: data.fecha,
    };
    updateSalidaMutation.mutate({ id: itemMatch.id, data: payload });

    const movimientoPayload = {
      id_insumo: itemMatch.insumoId,
      tipo_movimiento: 'Salida',
      cantidad,
      unidad_medida: data.unidad || itemMatch.unidad || 'unidad',
      fecha_movimiento: data.fecha,
    };
    createSalidaMovimientoMutation.mutate(movimientoPayload);
  };

  return (
    <div className="inventory-topbar">
      <div className="topbar-left">
        <button className="btn-action" onClick={() => setOpenSalida(true)}>Nueva salida</button>
        <button className="btn-action" onClick={() => setOpenEntrada(true)}>Nueva entrada</button>
        <button className="btn-action" onClick={() => setOpenNuevoInsumo(true)}>Nuevo insumo</button>
      </div>
      <div className="topbar-right">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar..."
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="stats-row">
        <div className="stats-card">
          <div className="stats-title">total de insumos</div>
          <div className="stats-value">{stats.totalInsumos}</div>
        </div>
        <div className="stats-card">
          <div className="stats-title">Unidad de medida</div>
          <div className="stats-value">{stats.unidadesCount}</div>
        </div>
        <div className="stats-card">
          <div className="stats-title">Última actualización</div>
          <div className="stats-value">{stats.lastUpdate}</div>
        </div>
      </div>
      <InventoryEntryModal
        open={openEntrada}
        insumos={insumos}
        onCancel={() => setOpenEntrada(false)}
        onSave={handleGuardarEntrada}
      />
      <InventoryExitModal
        open={openSalida}
        items={items}
        insumos={insumos}
        onCancel={() => setOpenSalida(false)}
        onSave={handleGuardarSalida}
      />
      <InventoryNewInsumoModal
        open={openNuevoInsumo}
        categorias={Array.isArray(categorias?.items) ? categorias.items : (Array.isArray(categorias) ? categorias : [])}
        almacenes={Array.isArray(almacenes?.items) ? almacenes.items : (Array.isArray(almacenes) ? almacenes : [])}
        onCancel={() => setOpenNuevoInsumo(false)}
        onSave={(data) => {
          handleGuardarNuevoInsumo(data);
        }}
      />
    </div>
  );
};

export default InventoryTopBar;
  const createSalidaMovimientoMutation = useMutation({
    mutationFn: (payload) => movimientosService.createMovimiento(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(['movimientos']),
        queryClient.invalidateQueries(['inventory', 'topbar']),
      ]);
    },
    onError: (e) => alert.error('Error', e?.response?.data?.message || e.message || 'No se pudo registrar la salida'),
  });