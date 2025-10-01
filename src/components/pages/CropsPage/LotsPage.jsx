import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import lotService from '../../../services/lotService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import LotFormModal from './LotFormModal';
import './LotsPage.css';

const LotsPage = () => {
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [filteredLots, setFilteredLots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  const canView = Boolean(user);
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  useEffect(() => {
    loadLots();
  }, []);

  useEffect(() => {
    const results = lots.filter(lot =>
      (lot.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lot.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredLots(results);
  }, [searchTerm, lots]);

  const loadLots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await lotService.getLots();
      setLots(Array.isArray(data) ? data : []);
      setFilteredLots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar los lotes:', error);
      setError(error.message === 'No tienes permisos para ver los lotes'
        ? 'No tienes permisos para ver los lotes. Contacta al administrador si crees que esto es un error.'
        : 'Error al cargar los lotes. Por favor intenta de nuevo más tarde.');
      setLots([]);
      setFilteredLots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (lot = null) => {
    console.log('Abriendo modal con lote:', lot);
    console.log('ID del lote seleccionado:', lot?.id);
    console.log('Valor activo del lote:', lot?.activo);
    setSelectedLot(lot);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedLot(null);
  };

  const handleSaveLot = async (lotData) => {
    try {
      console.log('Datos recibidos en handleSaveLot:', lotData);
      console.log('Lote seleccionado actualmente:', selectedLot);

      let successMsg = '';
      if (selectedLot && selectedLot.id) {
        if (!canEdit) throw new Error('No tienes permisos para editar lotes');
        console.log('Modo actualización - ID del lote:', selectedLot.id);
        console.log('Datos enviados a updateLot:', lotData);
        await lotService.updateLot(selectedLot.id, lotData);
        successMsg = 'Lote actualizado exitosamente';
      } else {
        if (!canCreate) throw new Error('No tienes permisos para crear lotes');
        console.log('Modo creación - sin ID de lote');
        console.log('Datos enviados a createLot:', lotData);
        await lotService.createLot(lotData);
        successMsg = 'Lote creado exitosamente';
      }
      loadLots();
      handleCloseModal();
      console.log(successMsg);
    } catch (error) {
      console.error('Error completo al guardar el lote:', error);
      console.error('Error response completo:', error.response);
      if (error.message?.includes('No tienes permisos')) {
        setError('No tienes permisos para realizar esta acción. Contacta al administrador si crees que esto es un error.');
        return;
      }
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      console.error('Error completo:', error);
      setError(`Error al guardar el lote: ${errorMessage}`);
    }
  };

  const handleDeleteLot = async (id) => {
    if (!canDelete) {
      setError('No tienes permisos para eliminar lotes');
      return;
    }

    if (window.confirm('¿Está seguro de eliminar este lote? Esta acción no se puede deshacer.')) {
      try {
        setError('');
        await lotService.deleteLot(id);
        await loadLots();
        console.log('Lote eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar el lote:', error);
        setError(error.message?.includes('No tienes permisos')
          ? 'No tienes permisos para eliminar lotes. Contacta al administrador si crees que esto es un error.'
          : 'Error al eliminar el lote. Por favor intenta de nuevo más tarde.');
      }
    }
  };

  if (loading) {
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
                          onClick={() => handleDeleteLot(lot.id)}
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
      />
    </div>
  );
};

export default LotsPage;
