import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress, Switch, Pagination } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import EpaForm from './EpaForm';
import EpaDetail from './EpaDetail';
import epaService from '../../../services/epaService';
import './EpasPage.css';

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

const typeConfig = {
  enfermedad: {
    color: '#d32f2f',
    bgColor: '#ffebee'
  },
  plaga: {
    color: '#ed6c02',
    bgColor: '#fff3e0'
  },
  arvense: {
    color: '#1976d2',
    bgColor: '#e3f2fd'
  },
  otro: {
    color: '#9c27b0',
    bgColor: '#f3e5f5'
  }
};

const EpasPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedEpa, setSelectedEpa] = useState(null);
  const [epaToChangeStatus, setEpaToChangeStatus] = useState(null);
  const [epaToDelete, setEpaToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canChangeStatus = isAdmin || isInstructor;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['epas', page],
    queryFn: () => epaService.getEpas(page, 10),
    keepPreviousData: true,
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar las EPAs.');
    }
  });

  const epas = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;

  const filteredEpas = useMemo(() => {
    if (!searchTerm) return epas;
    return epas.filter(epa =>
      (epa.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (epa.tipo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (epa.estado?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, epas]);

  const createEpaMutation = useMutation({
    mutationFn: epaService.createEpa,
    onSuccess: () => {
      queryClient.invalidateQueries(['epas']);
      handleCloseModal();
      alert.success('¡Éxito!', 'EPA creada correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo crear la EPA.');
    },
  });

  const updateEpaMutation = useMutation({
    mutationFn: (epaData) => epaService.updateEpa(epaData.id, epaData),
    onSuccess: () => {
      queryClient.invalidateQueries(['epas']);
      handleCloseModal();
      alert.success('¡Éxito!', 'EPA actualizada correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo actualizar la EPA.');
    },
  });

  const deleteEpaMutation = useMutation({
    mutationFn: epaService.deleteEpa,
    onSuccess: () => {
      queryClient.invalidateQueries(['epas']);
      setOpenDeleteModal(false);
      setEpaToDelete(null);
      alert.success('¡Éxito!', 'EPA eliminada correctamente.');
    },
    onError: (err) => {
      setOpenDeleteModal(false);
      alert.error('Error', err.message || 'No se pudo eliminar la EPA.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }) => epaService.updateEpa(id, data),
    onSuccess: (data) => {
      const newStatus = data.estado;
      queryClient.invalidateQueries(['epas']);
      setOpenConfirmModal(false);
      setEpaToChangeStatus(null);
      alert.success('¡Éxito!', `EPA ${newStatus === 'activo' ? 'activada' : 'desactivada'} correctamente.`);
    },
    onError: (err) => {
      setOpenConfirmModal(false);
      alert.error('Error', err.message || 'No se pudo cambiar el estado de la EPA.');
    },
  });

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handlePageChange = (event, value) => setPage(value);

  const handleOpenModal = (epa = null) => {
    setSelectedEpa(epa);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEpa(null);
  };

  const handleOpenDetailModal = (epa) => {
    setSelectedEpa(epa);
    setOpenDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSelectedEpa(null);
  };

  const handleSaveEpa = async (epaData) => {
    try {
      let savedEpa;

      if (epaData.id) {
        savedEpa = await updateEpaMutation.mutateAsync(epaData);
      } else {
        savedEpa = await createEpaMutation.mutateAsync(epaData);
      }

      // Si hay un archivo seleccionado, subir la imagen
      if (epaData.selectedFile && savedEpa?.id) {
        console.log('[EpasPage] Uploading image for EPA:', savedEpa.id);
        await epaService.uploadEpaImage(savedEpa.id, epaData.selectedFile);
        queryClient.invalidateQueries(['epas']);
        alert.success('¡Éxito!', 'EPA creada y imagen subida correctamente.');
      }
    } catch (error) {
      console.error('Error saving EPA:', error);
      alert.error('Error', error.message || 'No se pudo guardar la EPA.');
    }
  };

  const openDeleteConfirm = (epa) => {
    setEpaToDelete(epa);
    setOpenDeleteModal(true);
  };

  const handleDeleteEpa = () => {
    if (!epaToDelete) return;
    deleteEpaMutation.mutate(epaToDelete.id);
  };

  const openStatusConfirm = (epa) => {
    setEpaToChangeStatus(epa);
    setOpenConfirmModal(true);
  };

  const handleChangeStatus = () => {
    if (!epaToChangeStatus) return;
    const newStatus = epaToChangeStatus.estado === 'activo' ? 'inactivo' : 'activo';
    updateStatusMutation.mutate({ id: epaToChangeStatus.id, data: { estado: newStatus } });
  };

  const handleToggleStatus = (epa, checked) => {
    const newStatus = checked ? 'activo' : 'inactivo';
    updateStatusMutation.mutate({ id: epa.id, data: { estado: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <CircularProgress className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="epas-page">
        <div className="epas-header">
          <h1 className="epas-title">Gestión de EPA</h1>
          {canCreate && (
            <Button
              variant="contained"
              onClick={() => handleOpenModal()}
              startIcon={<Add />}
              className="new-epa-button"
            >
              Nueva EPA
            </Button>
          )}
        </div>

        <div className="search-container">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, tipo o estado..."
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
            {error?.message || 'Ocurrió un error al cargar las EPAs'}
          </Typography>
        )}

        <div className="epas-content">
          {isLoading ? (
            <CircularProgress className="loading-spinner" />
          ) : (
            <TableContainer className="epas-table-container">
              <Table className="epas-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEpas.length > 0 ? (
                    filteredEpas.map((epa) => (
                      <TableRow key={epa.id}>
                        <TableCell>{epa.nombre}</TableCell>
                        <TableCell>
                          <Chip
                            label={epa.tipo.charAt(0).toUpperCase() + epa.tipo.slice(1)}
                            style={{
                              backgroundColor: typeConfig[epa.tipo]?.bgColor || '#e0e0e0',
                              color: typeConfig[epa.tipo]?.color || '#333333'
                            }}
                            className="type-chip"
                          />
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Switch
                              checked={epa.estado === 'activo'}
                              color="success"
                              onChange={(e) => handleToggleStatus(epa, e.target.checked)}
                              inputProps={{ 'aria-label': 'Estado EPA' }}
                            />
                            <Typography variant="body2" color={epa.estado === 'activo' ? 'success.main' : 'text.secondary'}>
                              {epa.estado === 'activo' ? 'Activado' : 'Desactivada'}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleOpenDetailModal(epa)}
                            className="action-button view-button"
                            title="Ver detalles"
                          >
                            <Search />
                          </IconButton>
                          {canEdit && (
                            <IconButton
                              onClick={() => handleOpenModal(epa)}
                              className="action-button edit-button"
                              title="Editar"
                            >
                              <Edit />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={() => openDeleteConfirm(epa)}
                            className="action-button delete-button"
                            title="Eliminar"
                          >
                            <Delete style={{ color: '#d32f2f' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No se encontraron EPAs con los criterios de búsqueda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>

        {/* Modal para crear/editar EPA */}
        <EpaForm
          open={openModal}
          onClose={handleCloseModal}
          onSubmit={handleSaveEpa}
          epa={selectedEpa}
        />

        {/* Modal para ver detalles de EPA */}
        <EpaDetail
          open={openDetailModal}
          onClose={handleCloseDetailModal}
          epa={selectedEpa}
        />

        {/* Modal de confirmación para cambiar estado */}
        <ConfirmStatusModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleChangeStatus}
          epa={epaToChangeStatus}
          loading={updateStatusMutation.isLoading}
        />

        {/* Modal de confirmación para eliminar EPA */}
        <ConfirmModal
          isOpen={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          onConfirm={handleDeleteEpa}
          title="Eliminar EPA"
          message={epaToDelete ? `¿Estás seguro de eliminar la EPA "${epaToDelete.nombre}"?` : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          loading={deleteEpaMutation.isLoading}
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

const ConfirmStatusModal = ({ isOpen, onClose, onConfirm, epa, loading }) => {
  if (!epa) return null;
  
  const isActivating = epa.estado === 'inactivo';
  const actionText = isActivating ? 'activar' : 'desactivar';
  
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${isActivating ? 'Activar' : 'Desactivar'} EPA`}
      message={`¿Estás seguro de ${actionText} la EPA "${epa.nombre}"?`}
      confirmText={isActivating ? 'Activar' : 'Desactivar'}
      cancelText="Cancelar"
      type={isActivating ? 'success' : 'danger'}
      loading={loading}
    />
  );
};

export default EpasPage;