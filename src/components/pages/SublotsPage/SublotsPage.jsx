import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import sublotService from '../../../services/sublotService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import SublotFormModal from './SublotFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import './SublotsPage.css';

const statusConfig = {
  activo: {
    color: '#2e7d32',
    bgColor: '#e8f5e9'
  },
  inactivo: {
    color: '#d32f2f',
    bgColor: '#ffebee'
  }
};

const SublotsPage = () => {
  const { user } = useAuth();
  const [sublots, setSublots] = useState([]);
  const [filteredSublots, setFilteredSublots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedSublot, setSelectedSublot] = useState(null);
  const [sublotToDelete, setSublotToDelete] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canView = Boolean(user);
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  useEffect(() => {
    loadSublots();
  }, []);

  useEffect(() => {
    const results = sublots.filter(sublot =>
      sublot.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sublot.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sublot.nombre_lote.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSublots(results);
  }, [searchTerm, sublots]);

  const loadSublots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await sublotService.getSublots();
      setSublots(data);
      setFilteredSublots(data);
    } catch (error) {
      console.error('Error al cargar los sublotes:', error);
      setError(error.message === 'No tienes permisos para ver los sublotes'
        ? 'No tienes permisos para ver los sublotes. Contacta al administrador si crees que esto es un error.'
        : 'Error al cargar los sublotes. Por favor intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (sublot = null) => {
    setSelectedSublot(sublot);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSublot(null);
  };

  const handleSaveSublot = async (sublotData) => {
    try {
      let successMsg = '';
      if (selectedSublot) {
        if (!canEdit) throw new Error('No tienes permisos para editar sublotes');
        await sublotService.updateSublot(selectedSublot.id, sublotData);
        successMsg = 'Sublote actualizado exitosamente';
      } else {
        if (!canCreate) throw new Error('No tienes permisos para crear sublotes');
        await sublotService.createSublot(sublotData);
        successMsg = 'Sublote creado exitosamente';
      }
      loadSublots();
      handleCloseModal();
      console.log(successMsg);
    } catch (error) {
      console.error('Error al guardar el sublote:', error);
      if (error.message?.includes('No tienes permisos')) {
        setError('No tienes permisos para realizar esta acción. Contacta al administrador si crees que esto es un error.');
        return;
      }
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          setError(errorData.message);
          return;
        }
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          setError(errorMessages.join(', '));
          return;
        }
      }
      if (error.response?.status === 400) {
        setError('Los datos del sublote no son válidos. Verifica que todos los campos estén completos correctamente.');
      } else if (error.response?.status === 404) {
        setError('El lote asociado no fue encontrado. Verifica que el ID del lote sea correcto.');
      } else if (error.response?.status >= 500) {
        setError('Error del servidor. Por favor intenta de nuevo más tarde.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
      } else {
        setError(error.message || 'Error al guardar el sublote. Por favor intenta de nuevo más tarde.');
      }
    }
  };

  const handleDeleteSublot = async () => {
    if (!sublotToDelete || !canDelete) return;

    try {
      setError('');
      await sublotService.deleteSublot(sublotToDelete.id);
      await loadSublots();
      setOpenConfirmModal(false);
      setSublotToDelete(null);
      console.log('Sublote eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el sublote:', error);
      if (error.response?.status === 404) {
        setError(`El sublote "${sublotToDelete.descripcion}" no fue encontrado. Puede que ya haya sido eliminado.`);
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para eliminar sublotes. Contacta al administrador si crees que esto es un error.');
      } else if (error.response?.status >= 500) {
        setError('Error del servidor. Por favor intenta de nuevo más tarde.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
      } else {
        setError(`Error al eliminar el sublote: ${error.message || 'Error desconocido'}`);
      }
      setOpenConfirmModal(false);
      setSublotToDelete(null);
    }
  };

  const openDeleteConfirm = (sublot) => {
    setSublotToDelete(sublot);
    setOpenConfirmModal(true);
  };

  if (loading) {
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
        loading={loading}
      />
    </div>
  );
};

export default SublotsPage;
