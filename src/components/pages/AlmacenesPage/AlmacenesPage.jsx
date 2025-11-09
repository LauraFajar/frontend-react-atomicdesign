import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress, IconButton, Button } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import almacenesService from '../../../services/almacenesService';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import AlmacenFormModal from './AlmacenFormModal';
import '../InventoryPage/InventoryPage.css';

const AlmacenesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin || isInstructor;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['almacenes', page],
    queryFn: () => almacenesService.getAlmacenes(page, 10),
    keepPreviousData: true,
  });

  const almacenes = data?.items || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return almacenes;
    const term = searchTerm.toLowerCase();
    return almacenes.filter(a =>
      String(a.nombre || '').toLowerCase().includes(term) ||
      String(a.descripcion || '').toLowerCase().includes(term)
    );
  }, [searchTerm, almacenes]);

  const createMutation = useMutation({
    mutationFn: almacenesService.createAlmacen,
    onSuccess: () => {
      queryClient.invalidateQueries(['almacenes']);
      handleCloseForm();
      alert.success('¡Éxito!', 'Almacén creado correctamente.');
    },
    onError: (error) => {
      alert.error('Error', error.message || 'No se pudo crear el almacén.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => almacenesService.updateAlmacen(selected.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['almacenes']);
      handleCloseForm();
      alert.success('¡Éxito!', 'Almacén actualizado correctamente.');
    },
    onError: (error) => {
      alert.error('Error', error.message || 'No se pudo actualizar el almacén.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => almacenesService.deleteAlmacen(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['almacenes']);
      setOpenConfirmModal(false);
      setToDelete(null);
      alert.success('¡Éxito!', 'Almacén eliminado correctamente.');
    },
    onError: (error) => {
      setOpenConfirmModal(false);
      alert.error('Error', error.message || 'No se pudo eliminar el almacén.');
    },
  });

  const handleOpenForm = (item = null) => {
    if (!canCreate && !item) return;
    if (!canEdit && item) return;
    setSelected(item);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelected(null);
  };

  const handleSave = (formData) => {
    if (selected) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const openDeleteConfirm = (item) => {
    if (!canDelete) return;
    setToDelete(item);
    setOpenConfirmModal(true);
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id);
  };

  return (
    <div className="dashboard-content">
      <div className="inventory-page">
        <div className="users-header">
          <h1 className="users-title">Gestión de Almacenes</h1>
          {canCreate && (
            <Button
              variant="contained"
              onClick={() => handleOpenForm()}
              startIcon={<Add />}
              className="new-user-button"
            >
              Nuevo Almacén
            </Button>
          )}
        </div>

        <div className="search-container">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error?.message || 'Ocurrió un error al cargar los almacenes'}
          </Typography>
        )}

        <div className="users-table-container">
          <Table className="users-table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length > 0 ? (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.nombre}</TableCell>
                    <TableCell>{a.descripcion}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="right">
                        {canEdit && (
                          <IconButton
                            onClick={() => handleOpenForm(a)}
                            className="action-button edit-button"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton
                            onClick={() => openDeleteConfirm(a)}
                            className="action-button delete-button"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">
                        No hay almacenes para mostrar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
        <AlmacenFormModal
          open={openForm}
          onClose={handleCloseForm}
          onSave={handleSave}
          initialData={selected}
        />
        <ConfirmModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleDelete}
          title="Eliminar Almacén"
          message={toDelete ? `¿Eliminar almacén "${toDelete.nombre}"?` : '¿Eliminar almacén?'}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </div>
  );
};

export default AlmacenesPage;