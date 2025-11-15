import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress, Button, IconButton } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import sensoresService from '../../../services/sensoresService';
import { connectMqtt } from '../../../services/mqttClient';

const SensorFormModal = ({ open, onClose, onSave, initialData }) => {
  const [tipo, setTipo] = useState(initialData?.tipo_sensor || '');
  const [estado, setEstado] = useState(initialData?.estado || 'activo');
  const [minimo, setMinimo] = useState(initialData?.valor_minimo ?? '');
  const [maximo, setMaximo] = useState(initialData?.valor_maximo ?? '');
  const [unidad, setUnidad] = useState(initialData?.unidad_medida || '');
  const [ubicacion, setUbicacion] = useState(initialData?.ubicacion || '');

  useEffect(() => {
    setTipo(initialData?.tipo_sensor || '');
    setEstado(initialData?.estado || 'activo');
    setMinimo(initialData?.valor_minimo ?? '');
    setMaximo(initialData?.valor_maximo ?? '');
    setUnidad(initialData?.unidad_medida || '');
    setUbicacion(initialData?.ubicacion || '');
  }, [initialData, open]);

  if (!open) return null;
  return (
    <div className="inventory-modal-backdrop">
      <div className="inventory-modal">
        <h3 className="modal-title">{initialData ? 'Editar Sensor' : 'Nuevo Sensor'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ tipo_sensor: tipo, estado, valor_minimo: Number(minimo || 0), valor_maximo: Number(maximo || 0), unidad_medida: unidad, ubicacion }); }}>
          <div className="modal-form-field">
            <TextField label="Tipo de sensor" fullWidth value={tipo} onChange={(e) => setTipo(e.target.value)} />
          </div>
          <div className="modal-form-field">
            <TextField label="Estado" fullWidth value={estado} onChange={(e) => setEstado(e.target.value)} />
          </div>
          <div className="modal-form-field">
            <TextField label="Valor mínimo" type="number" fullWidth value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          </div>
          <div className="modal-form-field">
            <TextField label="Valor máximo" type="number" fullWidth value={maximo} onChange={(e) => setMaximo(e.target.value)} />
          </div>
          <div className="modal-form-field">
            <TextField label="Unidad de medida" fullWidth value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
          <div className="modal-form-field">
            <TextField label="Ubicación" fullWidth value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          </div>
          <div className="modal-actions">
            <Button className="btn-cancel" onClick={onClose}>Cancelar</Button>
            <Button className="btn-save" type="submit">{initialData ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IotPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [mqttStatus, setMqttStatus] = useState('disconnected');
  const [liveDevices, setLiveDevices] = useState({}); // { nombre: { temperatura, unidad, ts } }
  const mqttRef = useRef(null);
  const alert = useAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const canCreate = isAdmin || isInstructor;
  const canEdit = isAdmin || isInstructor;
  const canDelete = isAdmin || isInstructor;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sensores'],
    queryFn: () => sensoresService.getSensores(1, 50),
    keepPreviousData: true,
  });

  const sensors = data?.items || [];
  const filtered = useMemo(() => {
    if (!searchTerm) return sensors;
    const term = searchTerm.toLowerCase();
    return sensors.filter(s =>
      String(s.tipo_sensor || '').toLowerCase().includes(term) ||
      String(s.estado || '').toLowerCase().includes(term)
    );
  }, [searchTerm, sensors]);

  const createMutation = useMutation({
    mutationFn: sensoresService.createSensor,
    onSuccess: () => {
      queryClient.invalidateQueries(['sensores']);
      setOpenForm(false);
      alert.success('¡Éxito!', 'Sensor creado correctamente.');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el sensor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => sensoresService.updateSensor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sensores']);
      setOpenForm(false);
      setSelected(null);
      alert.success('¡Éxito!', 'Sensor actualizado correctamente.');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo actualizar el sensor'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sensoresService.deleteSensor(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sensores']);
      setOpenConfirmModal(false);
      setToDelete(null);
      alert.success('¡Éxito!', 'Sensor eliminado correctamente.');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo eliminar el sensor'),
  });

  // Conexión MQTT para lecturas en tiempo real (solo temperatura por ahora)
  useEffect(() => {
    const { client, disconnect } = connectMqtt({
      url: 'ws://test.mosquitto.org:8080/mqtt',
      topic: 'luixxa/dht11',
      onMessage: ({ data }) => {
        const nombre = data?.nombre || 'sensor';
        const temp = data?.temperatura ?? data?.temp ?? data?.value;
        if (temp === undefined || temp === null) return;
        const unidad = data?.unidad || '°C';
        setLiveDevices((prev) => ({
          ...prev,
          [nombre]: { nombre, temperatura: Number(temp), unidad, ts: new Date() },
        }));
      },
    });
    mqttRef.current = { client, disconnect };
    setMqttStatus('connected');
    return () => {
      setMqttStatus('disconnected');
      disconnect();
    };
  }, []);

  // Crear el sensor solicitado y registrar lectura hoy (una sola vez)
  useEffect(() => {
    const flag = localStorage.getItem('seed_sensor_humedad_ambiente_added');
    if (flag || !canCreate) return;
    const addSensor = async () => {
      try {
        const nuevo = await sensoresService.createSensor({
          tipo_sensor: 'humedad ambiente',
          estado: 'activo',
          valor_minimo: 15,
          valor_maximo: 50,
          unidad_medida: '%',
        });
        if (nuevo?.id) {
          await sensoresService.registrarLectura(nuevo.id, 30, '%', 'Lectura registrada hoy');
          alert.success('¡Éxito!', 'Sensor de humedad ambiente agregado y lectura de hoy registrada.');
          localStorage.setItem('seed_sensor_humedad_ambiente_added', '1');
          queryClient.invalidateQueries(['sensores']);
        }
      } catch (e) {
        alert.error('Error', e?.message || 'No se pudo crear y registrar lectura del sensor');
      }
    };
    addSensor();
  }, [queryClient, canCreate]);

  const handleSave = (formData) => {
    if (selected?.id) {
      if (!canEdit) {
        alert.error('Permisos', 'No tienes permisos para editar sensores');
        return;
      }
      updateMutation.mutate({ id: selected.id, payload: formData });
    } else {
      if (!canCreate) {
        alert.error('Permisos', 'No tienes permisos para crear sensores');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleOpenForm = (sensor = null) => {
    setSelected(sensor);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelected(null);
    setOpenForm(false);
  };

  const openDeleteConfirm = (sensor) => {
    setToDelete(sensor);
    setOpenConfirmModal(true);
  };

  const handleDelete = () => {
    if (!toDelete?.id) return;
    if (!canDelete) {
      alert.error('Permisos', 'No tienes permisos para eliminar sensores');
      return;
    }
    deleteMutation.mutate(toDelete.id);
  };

  return (
    <div className="dashboard-content">
      <div className="inventory-page">
        <div className="container-header">
          <h1 className="page-title">Sensores IoT</h1>
          <div className="header-actions">
            {canCreate && (
              <Button variant="contained" startIcon={<Add />} className="new-inventory-button" onClick={() => handleOpenForm()}>Nuevo Sensor</Button>
            )}
          </div>
        </div>

        <div className="search-container">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por tipo o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error?.message || 'Ocurrió un error al cargar los sensores'}
          </Typography>
        )}

        {/* Lecturas en tiempo real desde MQTT (por nombre del sensor) */}
        <div className="users-table-container" style={{ marginTop: 16 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Tiempo real (MQTT) · {mqttStatus === 'connected' ? 'Conectado' : 'Desconectado'}</Typography>
          <Table className="inventory-table">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Temperatura</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Recibido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(liveDevices).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">Esperando lecturas del tópico luixxa/dht11…</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                Object.values(liveDevices).map((d) => (
                  <TableRow key={d.nombre}>
                    <TableCell>{d.nombre}</TableCell>
                    <TableCell>{Number.isFinite(d.temperatura) ? d.temperatura.toFixed(2) : '-'}</TableCell>
                    <TableCell>{d.unidad}</TableCell>
                    <TableCell>{d.ts?.toLocaleString?.() || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="users-table-container">
          <Table className="inventory-table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Mínimo</TableCell>
                <TableCell>Máximo</TableCell>
                <TableCell>Última Lectura</TableCell>
                {(canEdit || canDelete) && (<TableCell align="right">Acciones</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}><CircularProgress /></TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length > 0 ? (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.tipo_sensor}</TableCell>
                    <TableCell>{s.estado}</TableCell>
                    <TableCell>{s.valor_minimo}</TableCell>
                    <TableCell>{s.valor_maximo}</TableCell>
                    <TableCell>{s.ultima_lectura || '-'}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="right">
                        {canEdit && (
                          <IconButton size="small" aria-label="editar" onClick={() => handleOpenForm(s)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton size="small" aria-label="eliminar" color="error" onClick={() => openDeleteConfirm(s)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">No hay sensores para mostrar.</Typography>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>

        <SensorFormModal
          open={openForm}
          onClose={handleCloseForm}
          onSave={handleSave}
          initialData={selected}
        />

        <ConfirmModal
          isOpen={openConfirmModal}
          onClose={() => setOpenConfirmModal(false)}
          onConfirm={handleDelete}
          title="Eliminar sensor"
          message={`¿Seguro que deseas eliminar el sensor "${toDelete?.tipo_sensor ?? ''}"?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          loading={deleteMutation.isLoading}
        />
      </div>
    </div>
  );
};

export default IotPage;