import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import activityService from '../../../services/activityService';
import cropService from '../../../services/cropService';
import {Button,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography,IconButton,Chip,CircularProgress,FormControl,InputLabel,Select,MenuItem,Box} from '@mui/material';
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
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  const canView = Boolean(user);
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, selectedCrop, startDate, endDate, activities]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [activitiesData, cropsData] = await Promise.all([
        activityService.getActivities(),
        cropService.getCrops()
      ]);

      setActivities(activitiesData);
      setCrops(cropsData);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setError(error.message === 'No tienes permisos para ver las actividades'
        ? 'No tienes permisos para ver las actividades. Contacta al administrador si crees que esto es un error.'
        : 'Error al cargar las actividades. Por favor intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.tipo_actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.detalles.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por cultivo
    if (selectedCrop) {
      filtered = filtered.filter(activity => activity.id_cultivo === parseInt(selectedCrop));
    }

    // Filtro por fechas
    if (startDate) {
      filtered = filtered.filter(activity => new Date(activity.fecha) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(activity => new Date(activity.fecha) <= endDate);
    }

    setFilteredActivities(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCropFilter = (e) => {
    setSelectedCrop(e.target.value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleOpenModal = (activity = null) => {
    setSelectedActivity(activity);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedActivity(null);
  };

  const handleSaveActivity = async (activityData) => {
    try {
      let successMsg = '';
      if (selectedActivity) {
        if (!canEdit) throw new Error('No tienes permisos para editar actividades');
        await activityService.updateActivity(selectedActivity.id, activityData);
        successMsg = 'Actividad actualizada exitosamente';
      } else {
        if (!canCreate) throw new Error('No tienes permisos para crear actividades');
        await activityService.createActivity(activityData);
        successMsg = 'Actividad creada exitosamente';
      }
      await loadData();
      handleCloseModal();
      console.log(successMsg);
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      if (error.message?.includes('No tienes permisos')) {
        setError('No tienes permisos para realizar esta acción. Contacta al administrador si crees que esto es un error.');
        return;
      }
      setError(error.response?.data?.message || 'Error al guardar la actividad. Por favor intenta de nuevo más tarde.');
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete || !canDelete) return;

    try {
      setError('');
      await activityService.deleteActivity(activityToDelete.id);
      await loadData();
      setOpenConfirmModal(false);
      setActivityToDelete(null);
      console.log('Actividad eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la actividad:', error);
      setError(error.message?.includes('No tienes permisos')
        ? 'No tienes permisos para eliminar actividades. Contacta al administrador si crees que esto es un error.'
        : 'Error al eliminar la actividad. Por favor intenta de nuevo más tarde.');
    }
  };

  const openDeleteConfirm = (activity) => {
    setActivityToDelete(activity);
    setOpenConfirmModal(true);
  };

  const getCropName = (cropId) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.tipo_cultivo : 'Cultivo no encontrado';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
        loading={loading}
      />
    </div>
  );
};

export default ActivitiesPage;
