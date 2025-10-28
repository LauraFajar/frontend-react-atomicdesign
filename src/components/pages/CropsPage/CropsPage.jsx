import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import cropService from '../../../services/cropService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress, Pagination } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import CropFormModal from './CropFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
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
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropToDelete, setCropToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['crops', page],
    queryFn: () => cropService.getCrops(page, 10),
    keepPreviousData: true,
  });

  const crops = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;

  const filteredCrops = useMemo(() => {
    if (!searchTerm) return crops;
    return crops.filter(crop =>
      crop.tipo_cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.estado_cultivo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, crops]);

  const createCropMutation = useMutation({
    mutationFn: cropService.createCrop,
    onSuccess: () => {
      queryClient.invalidateQueries(['crops']);
      handleCloseModal();
    },
  });

  const updateCropMutation = useMutation({
    mutationFn: ({ id, data }) => cropService.updateCrop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['crops']);
      handleCloseModal();
    },
  });

  const deleteCropMutation = useMutation({
    mutationFn: cropService.deleteCrop,
    onSuccess: () => {
      queryClient.invalidateQueries(['crops']);
      setOpenConfirmModal(false);
      setCropToDelete(null);
    },
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleOpenModal = (crop = null) => {
    setSelectedCrop(crop);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCrop(null);
  };

  const handleSaveCrop = (cropData) => {
    if (selectedCrop) {
      if (!canEdit) return;
      updateCropMutation.mutate({ id: selectedCrop.id, data: cropData });
    } else {
      if (!canCreate) return;
      createCropMutation.mutate(cropData);
    }
  };

  const handleDeleteCrop = () => {
    if (!cropToDelete || !canDelete) return;
    deleteCropMutation.mutate(cropToDelete.id);
  };

  const openDeleteConfirm = (crop) => {
    setCropToDelete(crop);
    setOpenConfirmModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
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

      {(isError || createCropMutation.isError || updateCropMutation.isError || deleteCropMutation.isError) && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error?.message || 
           createCropMutation.error?.message || 
           updateCropMutation.error?.message || 
           deleteCropMutation.error?.message || 
           'Ocurrió un error'}
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
                        onClick={() => openDeleteConfirm(crop)}
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

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={handleDeleteCrop}
        title="Eliminar Cultivo"
        message={`¿Estás seguro de eliminar el cultivo "${cropToDelete?.tipo_cultivo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteCropMutation.isLoading}
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
  );
};

export default CropsPage;
