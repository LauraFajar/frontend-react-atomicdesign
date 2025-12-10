import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import activityService from '../../../services/activityService';
import cropService from '../../../services/cropService';
import {Button,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography,IconButton,Chip,CircularProgress,FormControl,InputLabel,Select,MenuItem,Box, Pagination} from '@mui/material';
import { Add, Edit, Delete, Search, CameraAlt } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import ActivityFormModal from './ActivityFormModal';
import ActivityDetailModal from './ActivityDetailModal';
import PhotoUploadModal from './PhotoUploadModal';
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
  const { user, hasAnyPermission, permissions, refreshPermissions } = useAuth();
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [openPhotoModal, setOpenPhotoModal] = useState(false);
  const [activityForPhoto, setActivityForPhoto] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [activityForDetail, setActivityForDetail] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const isApprenticeOrIntern = user?.role === 'aprendiz' || user?.role === 'pasante';
  const permisosVer = ['actividades:ver','actividad:ver','actividades:listar'];
  const permisosCrear = ['actividades:crear','actividad:crear'];
  const permisosEditar = ['actividades:editar','actividad:editar'];
  const permisosEliminar = ['actividades:eliminar','actividad:eliminar'];

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
    console.log('[ActivitiesPage] user:', user);
    console.log('[ActivitiesPage] permissions:', permissions);
    console.log('[ActivitiesPage] flags:', { canView, canCreate, canEdit, canDelete, isAdmin, isInstructor });
  }, [user, permissions, canView, canCreate, canEdit, canDelete, isAdmin, isInstructor]);

  const filters = useMemo(() => ({
    id_cultivo: selectedCrop,
    fecha_inicio: startDate ? startDate.toISOString().split('T')[0] : undefined,
    fecha_fin: endDate ? endDate.toISOString().split('T')[0] : undefined,
  }), [selectedCrop, startDate, endDate]);

  const { data: activitiesData, isLoading: isLoadingActivities, isError: isActivitiesError, error: activitiesError } = useQuery({
    queryKey: ['activities', page, filters],
    queryFn: () => activityService.getActivities(filters, page, 10),
    keepPreviousData: true,
    enabled: canView,
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
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['inventory', 'low-stock']); 
      queryClient.removeQueries({ queryKey: ['inventory'] }); 
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
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['inventory', 'low-stock']); 
      queryClient.removeQueries({ queryKey: ['inventory'] }); 
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

  const handleOpenModal = async (activity = null) => {
    if (activity?.id) {
      try {
        const full = await activityService.getActivityById(activity.id);
        setSelectedActivity(full);
      } catch {
        setSelectedActivity(activity);
      }
    } else {
      setSelectedActivity(null);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedActivity(null);
  };

  const handleOpenPhotoModal = (activity) => {
    setActivityForPhoto(activity);
    setOpenPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setOpenPhotoModal(false);
    setActivityForPhoto(null);
  };

  const handleOpenDetailModal = (activity) => {
    setActivityForDetail(activity);
    setOpenDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setActivityForDetail(null);
  };

  const handlePhotoUploaded = () => {
    alert.success('¡Éxito!', 'Foto subida correctamente.');
    queryClient.invalidateQueries(['activities']);
    if (activityForPhoto?.id) {
      queryClient.invalidateQueries(['activityPhotos', activityForPhoto.id]);
    }
    handleClosePhotoModal();
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
    return crop ? (crop.displayName || crop.nombre_cultivo || crop.tipo_cultivo) : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (!canView) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <Typography variant="h6" color="error">No tienes permisos para ver Actividades.</Typography>
        </div>
      </div>
    );
  }

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
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <div className="filters-container">
        <div className="filters-row" style={{ gridTemplateColumns: 'minmax(560px, 1fr) minmax(560px, 1fr)' }}>
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

          <FormControl variant="outlined" className="filter-field" fullWidth>
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
                  {crop.displayName || crop.nombre_cultivo || crop.tipo_cultivo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="filters-row" style={{ gridTemplateColumns: 'minmax(560px, 1fr) minmax(560px, 1fr)' }}>
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  className: "filter-field",
                  variant: 'outlined',
                  sx: {
                    width: '100%',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--medium-gray)'
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-green)'
                    },
                    '& .MuiOutlinedInput-root.Mui-focused': {
                      boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.1)'
                    }
                  }
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
                  variant: 'outlined',
                  sx: {
                    width: '100%',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--medium-gray)'
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-green)'
                    },
                    '& .MuiOutlinedInput-root.Mui-focused': {
                      boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.1)'
                    }
                  }
                }
              }}
            />
        </div>
      </div>
      </LocalizationProvider>

      {isActivitiesError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {activitiesError?.message || 'Ocurrió un error al cargar las actividades'}
        </Typography>
      )}

      <div className="activities-table-container">
        <Table className="activities-table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
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
                <TableCell>{activity.id}</TableCell>
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
                    {(isAdmin || isInstructor) && (
                      <IconButton
                        onClick={() => handleOpenDetailModal(activity)}
                        className="action-button view-button"
                        size="small"
                        aria-label="Ver detalles"
                      >
                        <Search />
                      </IconButton>
                    )}
                    {(isApprenticeOrIntern || isAdmin) && (
                      <IconButton
                        onClick={() => handleOpenPhotoModal(activity)}
                        className="action-button photo-button"
                        size="small"
                      >
                        <CameraAlt />
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

      <PhotoUploadModal
        open={openPhotoModal}
        onClose={handleClosePhotoModal}
        onSave={handlePhotoUploaded} 
        activity={activityForPhoto}
      />

      <ActivityDetailModal
        open={openDetailModal}
        onClose={handleCloseDetailModal}
        activity={activityForDetail}
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
