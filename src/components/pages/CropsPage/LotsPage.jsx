import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import lotService from '../../../services/lotService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import LotFormModal from './LotFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import './LotsPage.css';

const LotsPage = () => {
  const { user, hasAnyPermission, permissions, refreshPermissions } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotToDelete, setLotToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const permisosVer = ['lotes:ver','lote:ver','lotes:listar'];
  const permisosCrear = ['lotes:crear','lote:crear'];
  const permisosEditar = ['lotes:editar','lote:editar'];
  const permisosEliminar = ['lotes:eliminar','lote:eliminar'];

  const canView = isAdmin || isInstructor || hasAnyPermission(permisosVer);
  const canCreate = isAdmin || hasAnyPermission(permisosCrear);
  const canEdit = isAdmin || hasAnyPermission(permisosEditar);
  const canDelete = isAdmin || hasAnyPermission(permisosEliminar);

  useEffect(() => {
    if (user?.id) {
      refreshPermissions(user.id);
    }
  }, []);

  useEffect(() => {
    console.log('[LotsPage] user:', user);
    console.log('[LotsPage] permissions:', permissions);
    console.log('[LotsPage] flags:', { canView, canCreate, canEdit, canDelete, isAdmin, isInstructor });
  }, [user, permissions, canView, canCreate, canEdit, canDelete, isAdmin, isInstructor]);

  const { data: lots = [], isLoading, isError, error } = useQuery({
    queryKey: ['lots'],
    queryFn: lotService.getLots,
    enabled: canView,
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar los lotes.');
    }
  });

  const filteredLots = useMemo(() => {
    if (!searchTerm) return lots;
    return lots.filter(lot =>
      (lot.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lot.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, lots]);

  const createLotMutation = useMutation({
    mutationFn: lotService.createLot,
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Lote creado correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo crear el lote.');
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: (lotData) => lotService.updateLot(lotData.id, lotData),
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Lote actualizado correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo actualizar el lote.');
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: lotService.deleteLot,
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      setOpenConfirmModal(false);
      setLotToDelete(null);
      alert.success('¡Éxito!', 'Lote eliminado correctamente.');
    },
    onError: (err) => {
      setOpenConfirmModal(false);
      alert.error('Error', err.message || 'No se pudo eliminar el lote.');
    },
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (lot = null) => {
    setSelectedLot(lot);
    setOpenModal(true);
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
  };

  if (!canView) {
    return (
      <div className="loading-container">
        <Typography variant="h6" color="error">No tienes permisos para ver Lotes.</Typography>
      </div>
    );
  }

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

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error.message}
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
    </div>
  );
};

export default LotsPage;