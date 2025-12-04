import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import sublotService from '../../../services/sublotService';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, IconButton, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import SublotFormModal from './SublotFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import './SublotsPage.css';

const SublotsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedSublot, setSelectedSublot] = useState(null);
  const [sublotToDelete, setSublotToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  const { data: sublots = [], isLoading, isError, error } = useQuery({
    queryKey: ['sublots'],
    queryFn: sublotService.getSublots,
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar los sublotes.');
    }
  });

  const filteredSublots = useMemo(() => {
    if (!searchTerm) return sublots;
    return sublots.filter(sublot =>
      sublot.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sublot.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sublot.nombre_lote.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sublots]);

  const createSublotMutation = useMutation({
    mutationFn: sublotService.createSublot,
    onSuccess: () => {
      queryClient.invalidateQueries(['sublots']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Sublote creado correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo crear el sublote.');
    },
  });

  const updateSublotMutation = useMutation({
    mutationFn: ({ id, data }) => sublotService.updateSublot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sublots']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Sublote actualizado correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo actualizar el sublote.');
    },
  });

  const deleteSublotMutation = useMutation({
    mutationFn: sublotService.deleteSublot,
    onSuccess: () => {
      queryClient.invalidateQueries(['sublots']);
      setOpenConfirmModal(false);
      setSublotToDelete(null);
      alert.success('¡Éxito!', 'Sublote eliminado correctamente.');
    },
    onError: (err) => {
      setOpenConfirmModal(false);
      alert.error('Error', err.message || 'No se pudo eliminar el sublote.');
    },
  });

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleOpenModal = (sublot = null) => {
    setSelectedSublot(sublot);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSublot(null);
  };

  const handleSaveSublot = (sublotData) => {
    if (selectedSublot) {
      if (!canEdit) return;
      updateSublotMutation.mutate({ id: selectedSublot.id, data: sublotData });
    } else {
      if (!canCreate) return;
      createSublotMutation.mutate(sublotData);
    }
  };

  const handleDeleteSublot = () => {
    if (!sublotToDelete || !canDelete) return;
    deleteSublotMutation.mutate(sublotToDelete.id);
  };

  const openDeleteConfirm = (sublot) => {
    setSublotToDelete(sublot);
    setOpenConfirmModal(true);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="sublots-page">
      <div className="sublots-header">
        <h1 className="sublots-title">Gestión de Sublotes</h1>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<Add />}
            className="new-sublot-button"
          >
            Nuevo Sublote
          </Button>
        )}
      </div>

      <div className="search-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por descripción, ubicación o lote..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search color="action" sx={{ mr: 1 }} />,
            className: "search-input"
          }}
        />
      </div>

      {(isError || createSublotMutation.isError || updateSublotMutation.isError || deleteSublotMutation.isError) && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error?.message || 
           createSublotMutation.error?.message || 
           updateSublotMutation.error?.message || 
           deleteSublotMutation.error?.message || 
           'Ocurrió un error'}
        </Typography>
      )}

      <div className="sublots-table-container">
        <Table className="sublots-table">
          <TableHead>
            <TableRow>
              <TableCell>Descripción</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Lote Asociado</TableCell>
              {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSublots.map((sublot) => (
              <TableRow key={sublot.id}>
                <TableCell>{sublot.descripcion}</TableCell>
                <TableCell>{sublot.ubicacion}</TableCell>
                <TableCell>{sublot.nombre_lote}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="right">
                    {canEdit && (
                      <IconButton
                        onClick={() => handleOpenModal(sublot)}
                        className="action-button edit-button"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        onClick={() => openDeleteConfirm(sublot)}
                        className="action-button delete-button"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SublotFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveSublot}
        sublot={selectedSublot}
      />

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={handleDeleteSublot}
        title="Eliminar Sublote"
        message={`¿Estás seguro de eliminar el sublote "${sublotToDelete?.descripcion}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteSublotMutation.isLoading}
      />
    </div>
  );
};

export default SublotsPage;
