import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress, Switch } from '@mui/material';
import { Add, Edit, Delete, Search, CheckCircle } from '@mui/icons-material';
import Modal from '../../molecules/Modal/Modal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import SuccessModal from '../../molecules/SuccessModal/SuccessModal';
import EpaForm from './EpaForm';
import EpaDetail from './EpaDetail';
import epaService from '../../../services/epaService';
import axios from 'axios';
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
  const [epas, setEpas] = useState([]);
  const [filteredEpas, setFilteredEpas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [selectedEpa, setSelectedEpa] = useState(null);
  const [epaToChangeStatus, setEpaToChangeStatus] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'administrador';
  const isInstructor = user?.role === 'instructor';
  const canView = Boolean(user);
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canChangeStatus = isAdmin || isInstructor;

  useEffect(() => {
    loadEpas();
  }, []);

  useEffect(() => {
    const results = filterEpas(epas, searchTerm);
    setFilteredEpas(results);
  }, [searchTerm, epas]);

  const loadEpas = async () => {
    setLoading(true);
    try {
      const response = await epaService.getEpas();
  
      const data = response.items ? response.items : response;
      
      setEpas(data);
      setFilteredEpas(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar EPAs:', error);
      setError('Error al cargar las EPAs. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const filterEpas = (epasToFilter, term) => {
    if (!epasToFilter) return [];
    return epasToFilter.filter(epa =>
      (epa.nombre?.toLowerCase() || '').includes(term.toLowerCase()) ||
      (epa.tipo?.toLowerCase() || '').includes(term.toLowerCase()) ||
      (epa.estado?.toLowerCase() || '').includes(term.toLowerCase())
    );
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (epa = null) => {
    setSelectedEpa(epa);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEpa(null);
    setError('');
  };

  const handleOpenDetailModal = (epa) => {
    setSelectedEpa(epa);
    setOpenDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSelectedEpa(null);
  };

  const handleToggleStatus = async (epa, checked) => {
    setLoading(true);
    try {
      const newStatus = checked ? 'activo' : 'inactivo';
      const epaId = epa.id_epa || epa.id;
      console.log('Toggle estado EPA:', { id: epaId, newStatus });

      await axios.patch(`http://localhost:3001/epa/${epaId}`, { estado: newStatus }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const updatedEpas = epas.map((item) => {
        const currentId = item.id_epa || item.id;
        return currentId === epaId ? { ...item, estado: newStatus } : item;
      });
      setEpas(updatedEpas);
      setFilteredEpas(filterEpas(updatedEpas, searchTerm));
    } catch (error) {
      console.error('Error al cambiar estado de EPA:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      setError('Error al cambiar el estado de la EPA: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [epaToDelete, setEpaToDelete] = useState(null);

  const openDeleteConfirm = (epa) => {
    setEpaToDelete(epa);
    setOpenDeleteModal(true);
  };

  const handleDeleteEpa = async () => {
    if (!epaToDelete) return;
    setLoading(true);
    try {
      const epaId = epaToDelete.id_epa || epaToDelete.id;
      console.log('EPA a eliminar:', epaToDelete);
      console.log('ID de EPA a eliminar:', epaId);
      console.log('Tipo de dato del ID:', typeof epaId);
      
      await epaService.deleteEpa(epaId);
      
      const updatedEpas = epas.filter((item) => {
        const itemId = item.id_epa || item.id;
        return itemId !== epaId;
      });
      
      setEpas(updatedEpas);
      setFilteredEpas(filterEpas(updatedEpas, searchTerm));
      setSuccessMessage('EPA eliminada correctamente');
      setOpenSuccessModal(true);
      setOpenDeleteModal(false);
      setEpaToDelete(null);
    } catch (error) {
      console.error('Error al eliminar EPA:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      setError('Error al eliminar la EPA: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };
  const openStatusConfirm = (epa) => {
    setEpaToChangeStatus(epa);
    setOpenConfirmModal(true);
  };

  const handleSaveEpa = async (epaData) => {
    setLoading(true);
    try {
      if (epaData.id) {
        const updatedEpa = await epaService.updateEpa(epaData.id, epaData);
        const updatedEpas = epas.map(epa => 
          epa.id === updatedEpa.id ? updatedEpa : epa
        );
        setEpas(updatedEpas);
        setSuccessMessage('EPA actualizada correctamente');
      } else {
        const newEpa = await epaService.createEpa(epaData);
        setEpas([...epas, newEpa]);
        setSuccessMessage('EPA creada correctamente');
      }
      
      handleCloseModal();
      setOpenSuccessModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error al guardar EPA:', error);
      setError('Error al guardar la EPA. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!epaToChangeStatus) return;
    
    setLoading(true);
    try {
      const newStatus = epaToChangeStatus.estado === 'activo' ? 'inactivo' : 'activo';
      
      const epaId = epaToChangeStatus.id_epa || epaToChangeStatus.id;
      
      console.log('Cambiando estado de EPA a:', newStatus);
      console.log('EPA a modificar:', epaToChangeStatus);
      console.log('ID de EPA usado:', epaId, 'Tipo:', typeof epaId);
      
      const epaData = {
        estado: newStatus
      };
      
      console.log('Datos a enviar:', epaData);
      console.log('URL de la petición:', `http://localhost:3001/epa/${epaId}`);
      
      const response = await axios.patch(
        `http://localhost:3001/epa/${epaId}`, 
        epaData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Respuesta del servidor:', response.data);
      
      const updatedEpa = {
        ...epaToChangeStatus,
        estado: newStatus
      };
      
      console.log('EPA actualizada:', updatedEpa);
      
      const updatedEpas = epas.map(epa => {
        const currentId = epa.id_epa || epa.id;
        return currentId === epaId ? updatedEpa : epa;
      });
      
      setEpas(updatedEpas);
      setFilteredEpas(filterEpas(updatedEpas, searchTerm));
      setOpenConfirmModal(false);
      setSuccessMessage(`EPA ${newStatus === 'activo' ? 'activada' : 'desactivada'} correctamente`);
      setOpenSuccessModal(true);
      setEpaToChangeStatus(null);
    } catch (error) {
      console.error('Error al cambiar estado de EPA:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      setError('Error al cambiar el estado de la EPA: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && epas.length === 0) {
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

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <div className="epas-content">
          {loading ? (
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
          loading={loading}
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
          loading={loading}
        />

        {}
        <SuccessModal
          isOpen={openSuccessModal}
          onClose={() => setOpenSuccessModal(false)}
          message={successMessage}
        />
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