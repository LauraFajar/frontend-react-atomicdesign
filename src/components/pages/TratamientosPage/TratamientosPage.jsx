import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Button, Card, CardContent, CardActions, Chip, Dialog, DialogActions, 
  DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel,
  MenuItem, Select, Stack, TextField, Tooltip, Typography 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import FilterListIcon from '@mui/icons-material/FilterList';
import tratamientoService from '../../../services/tratamientoService';
import epaService from '../../../services/epaService';
import './TratamientosPage.css';

import TratamientoForm from '../../TratamientoForm';
import TratamientoDetail from '../../TratamientoDetail';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';

const rolesCanEdit = ['Admin','Instructor', 'administrador', 'instructor'];
const rolesCanView = ['Admin','Instructor','Learner','Intern', 'administrador', 'instructor', 'aprendiz', 'pasante'];

const TratamientosPage = ({ currentUser }) => {
  const role = currentUser?.role || currentUser?.Role || currentUser?.roleLabel || 'Learner';
  console.log('Current user:', currentUser);
  console.log('Role detected:', role);

  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [epas, setEpas] = useState([]);
  const [filterEpaId, setFilterEpaId] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [tratamientoToDelete, setTratamientoToDelete] = useState(null);

  const canEdit = rolesCanEdit.includes(role);
  const canView = rolesCanView.includes(role);

  const fetchEpas = async () => {
    try {
      const response = await epaService.getEpas(1, 100); 
      const epasData = response.items || [];
      setEpas(epasData);
    } catch (err) {
      console.error('Error fetching EPAs for filter:', err);
    }
  };

  const fetchTratamientos = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(filterEpaId ? { epaId: filterEpaId } : {}),
        ...(filterTipo ? { tipo: filterTipo } : {})
      };
      const data = await tratamientoService.getTratamientos(filters);
      setTratamientos(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los tratamientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    fetchEpas();
  }, []);

  useEffect(() => {
    if (!canView) return;
    fetchTratamientos();
  }, [filterEpaId, filterTipo]);

  const handleCreate = () => {
    setSelected(null);
    setOpenForm(true);
  };

  const handleEdit = (t) => {
    setSelected(t);
    setOpenForm(true);
  };

  const handleDeleteClick = (t) => {
    setTratamientoToDelete(t);
    setOpenConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!canEdit || !tratamientoToDelete) return;
    
    try {
      await tratamientoService.deleteTratamiento(tratamientoToDelete.id);
      await fetchTratamientos();
      setOpenConfirmModal(false);
      setTratamientoToDelete(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el tratamiento');
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmModal(false);
    setTratamientoToDelete(null);
  };

  const handleSave = async (values) => {
    try {
      if (selected) {
        await tratamientoService.updateTratamiento(selected.id, values);
      } else {
        await tratamientoService.createTratamiento(values);
      }
      setOpenForm(false);
      setSelected(null);
      await fetchTratamientos();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el tratamiento');
    }
  };

  const handleOpenDetail = (t) => {
    setSelected(t);
    setOpenDetail(true);
  };
  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelected(null);
  };

  const sortedTratamientos = useMemo(() => {
    return [...tratamientos].sort((a, b) => {
      if (a.tipo === 'biologico' && b.tipo !== 'biologico') return -1;
      if (a.tipo !== 'biologico' && b.tipo === 'biologico') return 1;
      return a.id - b.id;
    });
  }, [tratamientos]);

  const tratamientosByEpa = useMemo(() => {
    const grouped = {};
    
    sortedTratamientos.forEach(t => {
      const epaId = t.id_epa;
      if (!grouped[epaId]) {
        grouped[epaId] = {
          epaId,
          epaNombre: t.epa_nombre || `EPA ${epaId}`,
          tratamientos: []
        };
      }
      grouped[epaId].tratamientos.push(t);
    });
    
    return Object.values(grouped).sort((a, b) => 
      a.epaNombre.localeCompare(b.epaNombre)
    );
  }, [sortedTratamientos]);

  if (!canView) {
    return (
      <Box className="page-wrapper">
        <Typography variant="h6">No tienes permisos para ver tratamientos.</Typography>
      </Box>
    );
  }

  return (
    <Box className="page-wrapper">
      <Box className="page-header">
        <Typography variant="h5" className="page-title">Tratamientos</Typography>
        {canEdit && (
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<AddIcon />} 
            onClick={handleCreate} 
            className="new-item-button"
          >
            Nuevo Tratamiento
          </Button>
        )}
      </Box>

      <Box className="filters search-container">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" className="search-input" sx={{ minWidth: 200 }}>
            <InputLabel id="epa-filter-label">Filtrar por EPA</InputLabel>
            <Select
              labelId="epa-filter-label"
              value={filterEpaId}
              label="Filtrar por EPA"
              onChange={(e) => setFilterEpaId(e.target.value)}
            >
              <MenuItem value="">
                <em>Todos los EPAs</em>
              </MenuItem>
              {epas.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.nombre || e.descripcion || `EPA ${e.id}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" className="search-input" sx={{ minWidth: 200 }}>
            <InputLabel id="tipo-filter-label">Tipo de Tratamiento</InputLabel>
            <Select
              labelId="tipo-filter-label"
              value={filterTipo}
              label="Tipo de Tratamiento"
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <MenuItem value="">
                <em>Todos los tipos</em>
              </MenuItem>
              <MenuItem value="biologico">Biológico</MenuItem>
              <MenuItem value="quimico">Químico</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box className="filter-count">
            <Typography variant="body2" color="text.secondary">
              {tratamientos.length} tratamiento{tratamientos.length !== 1 ? 's' : ''} encontrado{tratamientos.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {loading ? (
        <Box className="loading-container">
          <Typography>Cargando tratamientos...</Typography>
        </Box>
      ) : tratamientos.length === 0 ? (
        <Box className="empty-state">
          <Typography variant="h6" align="center" color="text.secondary">
            No hay tratamientos disponibles
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            {filterEpaId || filterTipo ? 'Prueba con otros filtros' : 'Crea un nuevo tratamiento para comenzar'}
          </Typography>
        </Box>
      ) : (
        <Box className="epa-groups-container">
          {tratamientosByEpa.map((group) => (
            <Box key={group.epaId} className="epa-group">
              <Box className="epa-header">
                <Typography variant="h6" className="epa-title">
                  {group.epaNombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {group.tratamientos.length} tratamiento{group.tratamientos.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              
              <Divider className="epa-divider" />
              
              <Grid container spacing={3} className="tratamientos-grid">
                {group.tratamientos.map((t) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
                    <Card 
                      className={`tratamiento-card ${t.tipo === 'biologico' ? 'biologico' : 'quimico'}`}
                      elevation={2}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Typography variant="h6" className="card-title" noWrap title={t.descripcion}>
                            {t.descripcion}
                          </Typography>
                          <Chip 
                            label={t.tipo === 'biologico' ? 'Biológico' : 'Químico'} 
                            size="small" 
                            className={`tipo-chip ${t.tipo === 'biologico' ? 'biologico' : 'quimico'}`}
                          />
                        </Stack>
                        
                        <Box mt={2}>
                          <Typography variant="body2" className="card-field">
                            <span className="field-label">Dosis:</span> {t.dosis}
                          </Typography>
                          <Typography variant="body2" className="card-field">
                            <span className="field-label">Frecuencia:</span> {t.frecuencia}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions className="card-actions">
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDetail(t)} 
                            className="action-button info-button"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canEdit && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEdit(t)} 
                                className="action-button edit-button"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteClick(t)} 
                                  className="action-button delete-button"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                          </>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}

      <TratamientoForm
        open={openForm}
        onClose={() => { setOpenForm(false); setSelected(null); setError(''); }}
        onSubmit={handleSave}
        tratamiento={selected}
        epas={epas}
      />

      <TratamientoDetail
        open={openDetail}
        onClose={handleCloseDetail}
        tratamiento={selected}
      />

      <Dialog open={!!error} onClose={() => setError('')}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setError('')}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Tratamiento"
        message={`¿Estás seguro de que deseas eliminar el tratamiento "${tratamientoToDelete?.descripcion || ''}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </Box>
  );
};

export default TratamientosPage;