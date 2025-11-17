import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress, IconButton, Button, Pagination } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import categoriasService from '../../../services/categoriasService';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import CategoriaFormModal from './CategoriaFormModal';
import '../InventoryPage/InventoryPage.css';

const CategoriasPage = () => {
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
    queryKey: ['categorias', page],
    queryFn: () => categoriasService.getCategorias(page, 10),
    keepPreviousData: true,
  });

  const categorias = data?.items || [];
  const serverTotalPages = data?.meta?.totalPages || 0;

  const filtered = useMemo(() => {
    if (!searchTerm) return categorias;
    const term = searchTerm.toLowerCase();
    return categorias.filter(c =>
      String(c.nombre || '').toLowerCase().includes(term) ||
      String(c.descripcion || '').toLowerCase().includes(term)
    );
  }, [searchTerm, categorias]);

  const isServerPaginated = serverTotalPages > 1;
  const totalPages = isServerPaginated ? serverTotalPages : Math.max(1, Math.ceil(filtered.length / 10));
  const displayed = useMemo(() => {
    if (isServerPaginated) return filtered;
    const start = (page - 1) * 10;
    const end = start + 10;
    return filtered.slice(start, end);
  }, [filtered, isServerPaginated, page]);

  const createMutation = useMutation({
    mutationFn: categoriasService.createCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias']);
      handleCloseForm();
      alert.success('¡Éxito!', 'Categoría creada correctamente.');
    },
    onError: (error) => {
      alert.error('Error', error.message || 'No se pudo crear la categoría.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => categoriasService.updateCategoria(selected.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias']);
      handleCloseForm();
      alert.success('¡Éxito!', 'Categoría actualizada correctamente.');
    },
    onError: (error) => {
      alert.error('Error', error.message || 'No se pudo actualizar la categoría.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriasService.deleteCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias']);
      setOpenConfirmModal(false);
      setToDelete(null);
      alert.success('¡Éxito!', 'Categoría eliminada correctamente.');
    },
    onError: (error) => {
      setOpenConfirmModal(false);
      alert.error('Error', error.message || 'No se pudo eliminar la categoría.');
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

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div className="dashboard-content">
      <div className="inventory-page">
        <div className="users-header">
          <h1 className="users-title">Gestión de Categorías</h1>
          {canCreate && (
            <Button
              variant="contained"
              onClick={() => handleOpenForm()}
              startIcon={<Add />}
              className="new-user-button"
            >
              Nueva Categoría
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
            {error?.message || 'Ocurrió un error al cargar las categorías'}
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
              {!isLoading && displayed.length > 0 ? (
                displayed.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.descripcion}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="right">
                        {canEdit && (
                          <IconButton
                            onClick={() => handleOpenForm(c)}
                            className="action-button edit-button"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton
                            onClick={() => openDeleteConfirm(c)}
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
                        No hay categorías para mostrar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
        <CategoriaFormModal
          open={openForm}
          onClose={handleCloseForm}
          onSave={handleSave}
          initialData={selected}
        />
        <ConfirmModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleDelete}
          title="Eliminar Categoría"
          message={toDelete ? `¿Eliminar categoría "${toDelete.nombre}"?` : '¿Eliminar categoría?'}
          confirmText="Eliminar"
          type="danger"
        />
        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriasPage;