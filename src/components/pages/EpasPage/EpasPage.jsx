import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import Modal from '../../molecules/Modal/Modal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import SuccessModal from '../../molecules/SuccessModal/SuccessModal';
import EpaForm from './EpaForm';
import EpaDetail from './EpaDetail';
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
    if (epas.length > 0) {
      filterEpas();
    }
  }, [searchTerm, epas]);

  const loadEpas = async () => {
    setLoading(true);
    try {
      const mockEpas = [
        { id: 1, nombre: 'Roya del café', descripcion: 'Enfermedad fúngica que afecta las hojas del café', tipo: 'enfermedad', estado: 'activo', imagen: null },
        { id: 2, nombre: 'Gorgojo del maíz', descripcion: 'Plaga que afecta los granos de maíz almacenados', tipo: 'plaga', estado: 'activo', imagen: null },
        { id: 3, nombre: 'Cuscuta', descripcion: 'Planta parásita que afecta diversos cultivos', tipo: 'arvense', estado: 'activo', imagen: null },
        { id: 4, nombre: 'Sigatoka negra', descripcion: 'Enfermedad fúngica que afecta las hojas del plátano', tipo: 'enfermedad', estado: 'inactivo', imagen: null }
      ];
      
      // En producción, usar:
      // const response = await fetch('/api/epa');
      // const data = await response.json();
      // setEpas(data);
      
      setEpas(mockEpas);
      setFilteredEpas(mockEpas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar EPAs:', error);
      setError('Error al cargar las EPAs. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const filterEpas = () => {
    const results = epas.filter(epa =>
      epa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      epa.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      epa.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEpas(results);
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

  const openStatusConfirm = (epa) => {
    setEpaToChangeStatus(epa);
    setOpenConfirmModal(true);
  };

  const handleSaveEpa = async (epaData) => {
    setLoading(true);
    try {
      if (epaData.id) {
        const updatedEpas = epas.map(epa => 
          epa.id === epaData.id ? { ...epa, ...epaData } : epa
        );
        setEpas(updatedEpas);
        setSuccessMessage('EPA actualizada correctamente');
      } else {
        const newEpa = {
          ...epaData,
          id: epas.length + 1,
          estado: epaData.estado || 'activo'
        };
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
      const updatedEpas = epas.map(epa => 
        epa.id === epaToChangeStatus.id ? { ...epa, estado: newStatus } : epa
      );
      
      setEpas(updatedEpas);
      setOpenConfirmModal(false);
      setSuccessMessage(`EPA ${newStatus === 'activo' ? 'activada' : 'desactivada'} correctamente`);
      setOpenSuccessModal(true);
      setEpaToChangeStatus(null);
      setLoading(false);
    } catch (error) {
      console.error('Error al cambiar estado de EPA:', error);
      setError('Error al cambiar el estado de la EPA. Por favor, intenta de nuevo.');
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
                          <Chip
                            label={epa.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            style={{
                              backgroundColor: statusConfig[epa.estado]?.bgColor || '#e0e0e0',
                              color: statusConfig[epa.estado]?.color || '#333333'
                            }}
                            className="status-chip"
                          />
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
                          {canChangeStatus && (
                            <IconButton
                              onClick={() => openStatusConfirm(epa)}
                              className="action-button status-button"
                              title={epa.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            >
                              <Delete style={{ color: '#d32f2f' }} />
                            </IconButton>
                          )}
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