import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import cropService from '../../../services/cropService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import CropFormModal from './CropFormModal';
import './CropsPage.css';

const statusConfig = {
  sembrado: {
    color: '#1976d2',
    bgColor: '#e3f2fd'
  },
  en_crecimiento: {
    color: '#ed6c02',
    bgColor: '#fff3e0'
  },
  cosechado: {
    color: '#2e7d32',
    bgColor: '#e8f5e9'
  },
  perdido: {
    color: '#d32f2f',
    bgColor: '#ffebee'
  }
};

const CropsPage = () => {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  const canView = Boolean(user);
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    const results = crops.filter(crop =>
      crop.tipo_cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.estado_cultivo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCrops(results);
  }, [searchTerm, crops]);

  const loadCrops = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await cropService.getCrops();
      setCrops(data);
      setFilteredCrops(data);
    } catch (error) {
      console.error('Error al cargar los cultivos:', error);
      setError(error.message === 'No tienes permisos para ver los cultivos'
        ? 'No tienes permisos para ver los cultivos. Contacta al administrador si crees que esto es un error.'
        : 'Error al cargar los cultivos. Por favor intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (crop = null) => {
    setSelectedCrop(crop);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCrop(null);
  };

  const handleSaveCrop = async (cropData) => {
    try {
      let successMsg = '';
      if (selectedCrop) {
        if (!canEdit) throw new Error('No tienes permisos para editar cultivos');
        await cropService.updateCrop(selectedCrop.id, cropData);
        successMsg = 'Cultivo actualizado exitosamente';
      } else {
        if (!canCreate) throw new Error('No tienes permisos para crear cultivos');
        await cropService.createCrop(cropData);
        successMsg = 'Cultivo creado exitosamente';
      }
      loadCrops();
      handleCloseModal();
      console.log(successMsg);
    } catch (error) {
      console.error('Error al guardar el cultivo:', error);
      if (error.message?.includes('No tienes permisos')) {
        setError('No tienes permisos para realizar esta acción. Contacta al administrador si crees que esto es un error.');
        return;
      }
      setError(error.response?.data?.message || 'Error al guardar el cultivo. Por favor intenta de nuevo más tarde.');
    }
  };

  const handleDeleteCrop = async (id) => {
    if (!canDelete) {
      setError('No tienes permisos para eliminar cultivos');
      return;
    }

    if (window.confirm('¿Está seguro de eliminar este cultivo? Esta acción no se puede deshacer.')) {
      try {
        setError('');
        await cropService.deleteCrop(id);
        await loadCrops();
        console.log('Cultivo eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar el cultivo:', error);
        setError(error.message?.includes('No tienes permisos')
          ? 'No tienes permisos para eliminar cultivos. Contacta al administrador si crees que esto es un error.'
          : 'Error al eliminar el cultivo. Por favor intenta de nuevo más tarde.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="crops-page">
      <div className="crops-header">
        <h1 className="crops-title">Gestión de Cultivos</h1>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<Add />}
            className="new-crop-button"
          >
            Nuevo Cultivo
          </Button>
        )}
      </div>

      <div className="search-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por tipo o estado de cultivo..."
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

      <div className="crops-table-container">
        <Table className="crops-table">
          <TableHead>
            <TableRow>
              <TableCell>Tipo de Cultivo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha de Siembra</TableCell>
              <TableCell>Fecha de Cosecha</TableCell>
              {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCrops.map((crop) => (
              <TableRow key={crop.id}>
                <TableCell>{crop.tipo_cultivo}</TableCell>
                <TableCell>
                  <Chip
                    label={crop.estado_cultivo}
                    className={`status-chip ${crop.estado_cultivo.toLowerCase()}`}
                  />
                </TableCell>
                <TableCell>{formatDate(crop.fecha_siembra)}</TableCell>
                <TableCell>{formatDate(crop.fecha_cosecha)}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="right">
                    {canEdit && (
                      <IconButton
                        onClick={() => handleOpenModal(crop)}
                        className="action-button edit-button"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        onClick={() => handleDeleteCrop(crop.id)}
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

      <CropFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveCrop}
        crop={selectedCrop}
      />
    </div>
  );
};

export default CropsPage;
