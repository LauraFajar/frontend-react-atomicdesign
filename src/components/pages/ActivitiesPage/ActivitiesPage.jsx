import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import activityService from '../../../services/activityService';
import cropService from '../../../services/cropService';
import {Button,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography,IconButton,Chip,CircularProgress,FormControl,InputLabel,Select,MenuItem,Box, Pagination} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import ActivityFormModal from './ActivityFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import './ActivitiesPage.css';

const statusConfig = {
  pendiente: {
    color: '#f57c00',
    bgColor: '#fff3e0',
    label: 'Pendiente'
  },
  en_progreso: {
    color: '#1976d2',
    bgColor: '#e3f2fd',
    label: 'En Progreso'
  },
  completada: {
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    label: 'Completada'
  },
  cancelada: {
    color: '#d32f2f',
    bgColor: '#ffebee',
    label: 'Cancelada'
  }
};

const ActivitiesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  const filters = useMemo(() => ({
    id_cultivo: selectedCrop,
    fecha_inicio: startDate ? startDate.toISOString().split('T')[0] : undefined,
    fecha_fin: endDate ? endDate.toISOString().split('T')[0] : undefined,
  }), [selectedCrop, startDate, endDate]);

  const { data: activitiesData, isLoading: isLoadingActivities, isError: isActivitiesError, error: activitiesError } = useQuery({
    queryKey: ['activities', page, filters],
    queryFn: () => activityService.getActivities(filters, page, 10),
    keepPreviousData: true,
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar las actividades.');
    }
  });

  const { data: cropsData } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => cropService.getCrops(1, 100),
    staleTime: Infinity, 
  });

  const activities = activitiesData?.items || [];
  const totalPages = activitiesData?.meta?.totalPages || 1;
  const crops = cropsData?.items || [];

  const filteredActivities = useMemo(() => {
    if (!searchTerm) return activities;
    return activities.filter(activity =>
      activity.tipo_actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.detalles.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activities]);

  const createActivityMutation = useMutation({
    mutationFn: activityService.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Actividad creada correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo crear la actividad.');
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => activityService.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      handleCloseModal();
      alert.success('¡Éxito!', 'Actividad actualizada correctamente.');
    },
    onError: (err) => {
      alert.error('Error', err.message || 'No se pudo actualizar la actividad.');
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: activityService.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setOpenConfirmModal(false);
      setActivityToDelete(null);
      alert.success('¡Éxito!', 'Actividad eliminada correctamente.');
    },
    onError: (err) => {
      setOpenConfirmModal(false);
      alert.error('Error', err.message || 'No se pudo eliminar la actividad.');
    },
  });

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleCropFilter = (e) => setSelectedCrop(e.target.value);
  const handleStartDateChange = (date) => setStartDate(date);
  const handleEndDateChange = (date) => setEndDate(date);
  const handlePageChange = (event, value) => setPage(value);

  const handleOpenModal = (activity = null) => {
    setSelectedActivity(activity);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedActivity(null);
  };

  const handleSaveActivity = (activityData) => {
    if (selectedActivity) {
      if (!canEdit) return;
      updateActivityMutation.mutate({ id: selectedActivity.id, data: activityData });
    } else {
      if (!canCreate) return;
      createActivityMutation.mutate(activityData);
    }
  };

  const handleDeleteActivity = () => {
    if (!activityToDelete || !canDelete) return;
    deleteActivityMutation.mutate(activityToDelete.id);
  };

  const openDeleteConfirm = (activity) => {
    setActivityToDelete(activity);
    setOpenConfirmModal(true);
  };

  const getCropName = (cropId) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.tipo_cultivo : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoadingActivities) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="activities-page">
      <div className="activities-header">
        <h1 className="activities-title">Gestión de Actividades</h1>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<Add />}
            className="new-activity-button"
          >
            Nueva Actividad
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-row">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por tipo, responsable o detalles..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <Search color="action" sx={{ mr: 1 }} />,
              className: "search-input"
            }}
            className="filter-field"
          />

          <FormControl variant="outlined" className="filter-field">
            <InputLabel>Cultivo</InputLabel>
            <Select
              value={selectedCrop}
              onChange={handleCropFilter}
              label="Cultivo"
            >
              <MenuItem value="">
                <em>Todos los cultivos</em>
              </MenuItem>
              {crops.map(crop => (
                <MenuItem key={crop.id} value={crop.id}>
                  {crop.tipo_cultivo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="filters-row">
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  className: "filter-field",
                  sx: { minWidth: '200px' }
                }
              }}
            />

            <DatePicker
              label="Fecha fin"
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate}
              slotProps={{
                textField: {
                  className: "filter-field",
                  sx: { minWidth: '200px' }
                }
              }}
            />
          </LocalizationProvider>
        </div>
      </div>

      {isActivitiesError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {activitiesError?.message || 'Ocurrió un error al cargar las actividades'}
        </Typography>
      )}

      <div className="activities-table-container">
        <Table className="activities-table">
          <TableHead>
            <TableRow>
              <TableCell>Tipo de Actividad</TableCell>
              <TableCell>Cultivo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Estado</TableCell>
              {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{activity.tipo_actividad}</TableCell>
                <TableCell>{getCropName(activity.id_cultivo)}</TableCell>
                <TableCell>{formatDate(activity.fecha)}</TableCell>
                <TableCell>{activity.responsable}</TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[activity.estado]?.label || activity.estado}
                    sx={{
                      backgroundColor: statusConfig[activity.estado]?.bgColor,
                      color: statusConfig[activity.estado]?.color,
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="right">
                    {canEdit && (
                      <IconButton
                        onClick={() => handleOpenModal(activity)}
                        className="action-button edit-button"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        onClick={() => openDeleteConfirm(activity)}
                        className="action-button delete-button"
                        size="small"
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

      <ActivityFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveActivity}
        activity={selectedActivity}
        crops={crops}
      />

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={handleDeleteActivity}
        title="Eliminar Actividad"
        message={`¿Estás seguro de eliminar la actividad "${activityToDelete?.tipo_actividad}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteActivityMutation.isLoading}
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

export default ActivitiesPage;
