import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import lotService from '../../../services/lotService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import LotFormModal from './LotFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import SuccessModal from '../../molecules/SuccessModal/SuccessModal';
import './LotsPage.css';

const LotsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotToDelete, setLotToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  const { data: lots = [], isLoading, isError, error } = useQuery({
    queryKey: ['lots'],
    queryFn: lotService.getLots,
    onError: (err) => {
      setErrorMessage(err.message === 'No tienes permisos para ver los lotes'
        ? 'No tienes permisos para ver los lotes. Contacta al administrador si crees que esto es un error.'
        : 'Error al cargar los lotes. Por favor intenta de nuevo más tarde.');
    }
  });

  const filteredLots = useMemo(() => {
    if (!searchTerm) return lots;
    return lots.filter(lot =>
      (lot.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lot.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, lots]);

  const handleMutationSuccess = (message) => {
    setSuccessMessage(message);
    setOpenSuccessModal(true);
    queryClient.invalidateQueries(['lots']);
    setErrorMessage('');
  };

  const handleMutationError = (error, defaultMessage) => {
    const message = error.response?.data?.message || error.message || defaultMessage;
    setErrorMessage(message);
  };

  const createLotMutation = useMutation({
    mutationFn: lotService.createLot,
    onSuccess: () => {
      handleMutationSuccess('Lote creado exitosamente');
      handleCloseModal();
    },
    onError: (err) => handleMutationError(err, 'Error al crear el lote'),
  });

  const updateLotMutation = useMutation({
    mutationFn: (lotData) => lotService.updateLot(lotData.id, lotData),
    onSuccess: () => {
      handleMutationSuccess('Lote actualizado exitosamente');
      handleCloseModal();
    },
    onError: (err) => handleMutationError(err, 'Error al actualizar el lote'),
  });

  const deleteLotMutation = useMutation({
    mutationFn: lotService.deleteLot,
    onSuccess: () => {
      handleMutationSuccess('Lote eliminado exitosamente');
      setOpenConfirmModal(false);
      setLotToDelete(null);
    },
    onError: (err) => {
      handleMutationError(err, 'Error al eliminar el lote');
      setOpenConfirmModal(false);
    },
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (lot = null) => {
    setSelectedLot(lot);
    setOpenModal(true);
    setErrorMessage('');
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedLot(null);
  };

  const handleSaveLot = (lotData) => {
    const dataToSave = {
      ...lotData,
      nombre_lote: lotData.nombre,
    };

    if (selectedLot && selectedLot.id) {
      updateLotMutation.mutate({ ...dataToSave, id: selectedLot.id });
    } else {
      createLotMutation.mutate(dataToSave);
    }
  };

  const handleDeleteLot = () => {
    if (!lotToDelete) return;
    deleteLotMutation.mutate(lotToDelete.id);
  };

  const openDeleteConfirm = (lot) => {
    setLotToDelete(lot);
    setOpenConfirmModal(true);
    setErrorMessage('');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="lots-page">
      <div className="lots-header">
        <h1 className="lots-title">Gestión de Lotes</h1>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<Add />}
            className="new-lot-button"
          >
            Nuevo Lote
          </Button>
        )}
      </div>

      <div className="search-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search color="action" sx={{ mr: 1 }} />,
            className: "search-input"
          }}
        />
      </div>

      {(isError || errorMessage) && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorMessage || error.message}
        </Typography>
      )}

      <div className="lots-table-container">
        <Table className="lots-table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLots.length > 0 ? (
              filteredLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{lot.descripcion || 'Sin descripción'}</TableCell>
                  <TableCell>
                    <Chip
                      label={lot.activo ? 'Disponible' : 'Ocupado'}
                      className={`status-chip ${lot.activo ? 'active' : 'inactive'}`}
                    />
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton
                          onClick={() => handleOpenModal(lot)}
                          className="action-button edit-button"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          onClick={() => openDeleteConfirm(lot)}
                          className="action-button delete-button"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canEdit || canDelete ? 4 : 3} align="center">
                  {searchTerm ? 'No se encontraron lotes que coincidan con la búsqueda' : 'No hay lotes registrados'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LotFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveLot}
        lot={selectedLot}
        key={selectedLot ? selectedLot.id : 'new'}
        isLoading={createLotMutation.isLoading || updateLotMutation.isLoading}
        error={createLotMutation.error || updateLotMutation.error}
      />

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={handleDeleteLot}
        title="Eliminar Lote"
        message={`¿Estás seguro de eliminar el lote "${lotToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteLotMutation.isLoading}
      />

      <SuccessModal
        isOpen={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        message={successMessage}
      />
    </div>
  );
};

export default LotsPage;