import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../../contexts/AlertContext';
import InventoryTable from './components/InventoryTable';
// import InventoryForm from './components/InventoryForm';
import InventoryItemModal from './components/InventoryItemModal';
import InventoryTopBar from './components/InventoryTopBar';
import inventoryService from '../../../services/inventoryService';
import './InventoryPage.css';

const InventoryPage = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const alert = useAlert();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getItems(1, 50),
    keepPreviousData: true,
  });

  const items = data?.items || [];
  const filteredItems = useMemo(() => {
    if (!filterTerm) return items;
    return items.filter(i => (
      String(i.nombre).toLowerCase().includes(filterTerm.toLowerCase()) ||
      String(i.unidad).toLowerCase().includes(filterTerm.toLowerCase())
    ));
  }, [items, filterTerm]);

  const createMutation = useMutation({
    mutationFn: inventoryService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setSelectedItem(null);
      alert.success('Inventario', 'Elemento creado correctamente');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el elemento'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setSelectedItem(null);
      alert.success('Inventario', 'Elemento actualizado correctamente');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo actualizar el elemento'),
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      alert.success('Inventario', 'Elemento eliminado correctamente');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo eliminar el elemento'),
  });

  const handleAddOrUpdate = (formData) => {
    if (selectedItem?.id) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleFilter = (term) => {
    setFilterTerm(term);
  };

  const handleNewEntrada = () => {
    setSelectedItem(null);
    alert.info('Inventario', 'Registra una nueva entrada usando el formulario.');
  };

  const handleNewSalida = () => {
    setSelectedItem(null);
    alert.info('Inventario', 'Registra una nueva salida usando el formulario.');
  };

  const handleNuevoInsumo = () => {
    setSelectedItem(null);
    alert.info('Inventario', 'Agrega un nuevo insumo al inventario con el formulario.');
  };

  return (
    <div className="inventory-page">
      <h1>Gestión de Inventario</h1>
      <InventoryTopBar
        onNewSalida={handleNewSalida}
        onNewEntrada={handleNewEntrada}
        onNuevoInsumo={handleNuevoInsumo}
        onSearch={handleFilter}
      />
      {/* Barra de búsqueda inferior eliminada */}
      {/* Formulario inline reemplazado por modal para mejorar estética */}
      {/* <InventoryForm onSave={handleAddOrUpdate} selectedItem={selectedItem} /> */}
      <InventoryTable
        items={filteredItems}
        onEdit={(item) => { setSelectedItem(item); setOpenItemModal(true); }}
        onDelete={handleDelete}
      />
      <InventoryItemModal
        open={openItemModal}
        selectedItem={selectedItem}
        onCancel={() => { setOpenItemModal(false); setSelectedItem(null); }}
        onSave={(values) => { handleAddOrUpdate(values); setOpenItemModal(false); setSelectedItem(null); }}
      />
      {isLoading && <p>Cargando inventario...</p>}
      {isError && <p>Error al cargar inventario.</p>}
    </div>
  );
};

export default InventoryPage;
