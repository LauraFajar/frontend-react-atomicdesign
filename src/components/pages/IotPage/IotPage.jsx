import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress, Button, IconButton, Card, CardContent, Grid, Box } from '@mui/material';
import { Add, Edit, Delete, ChevronLeft, ChevronRight, DeviceThermostat, WaterDrop, Grass, TrendingUp, TrendingDown, TrendingFlat, Warning } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import sensoresService from '../../../services/sensoresService';
import AlertPanel from '../../widgets/AlertPanel';

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

  const [realTimeData, setRealTimeData] = useState({});
  const [previousValues, setPreviousValues] = useState({});
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [showManagement, setShowManagement] = useState(false);
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
    retry: 1,
    onError: (err) => {
      console.warn('Sensors API failed, using mock data:', err.message);
    }
  });

  const mockSensors = [
    {
      id: 1,
      tipo_sensor: 'temperatura',
      estado: 'activo',
      valor_minimo: 0,
      valor_maximo: 50,
      unidad_medida: '°C',
      ubicacion: 'ESP32 DHT11',
      valor_actual: 28.5
    },
    {
      id: 2,
      tipo_sensor: 'humedad aire',
      estado: 'activo',
      valor_minimo: 0,
      valor_maximo: 100,
      unidad_medida: '%',
      ubicacion: 'ESP32 DHT11',
      valor_actual: 65.2
    },
    {
      id: 3,
      tipo_sensor: 'humedad suelo',
      estado: 'activo',
      valor_minimo: 0,
      valor_maximo: 4095,
      unidad_medida: 'ADC',
      ubicacion: 'ESP32 Sensor Suelo',
      valor_actual: 1850
    }
  ];

  const sensors = (data?.items && data.items.length > 0) ? data.items : mockSensors;

  const { data: realTimeDataResponse } = useQuery({
    queryKey: ['sensores-tiempo-real'],
    queryFn: () => sensoresService.getTiempoReal(),
    refetchInterval: 5000, 
    enabled: (data?.items || []).length > 0,
  });

  const filtered = useMemo(() => {
    const sensorList = data?.items || [];
    if (!searchTerm) return sensorList;
    const term = searchTerm.toLowerCase();
    return sensorList.filter(s =>
      String(s.tipo_sensor || '').toLowerCase().includes(term) ||
      String(s.estado || '').toLowerCase().includes(term)
    );
  }, [searchTerm, data?.items]);
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

  useEffect(() => {
    setMqttStatus('mock');
    console.log('MQTT disabled - using mock data for ESP32 sensors');
  }, []);

  useEffect(() => {
    if (realTimeDataResponse) {
      const dataMap = {};
      realTimeDataResponse.forEach(sensor => {
        dataMap[sensor.id] = sensor;
      });
      setRealTimeData(prevData => {data 
        const newPrev = {};
        Object.keys(dataMap).forEach(id => {
          if (prevData[id]?.valor_actual != null) {
            newPrev[id] = prevData[id].valor_actual;
          }
        });
        setPreviousValues(newPrev);
        return dataMap;
      });
    }
  }, [realTimeDataResponse]);

  useEffect(() => {
    const updateMockData = () => {
      const mockLiveData = {
        temperatura: {
          nombre: 'temperatura',
          valor: 29.5 + (Math.random() - 0.5) * 4, // 27.5-31.5°C
          unidad: '°C',
          ts: new Date()
        },
        humedad_aire: {
          nombre: 'humedad_aire',
          valor: 60 + (Math.random() - 0.5) * 20, // 50-70%
          unidad: '%',
          ts: new Date()
        },
        humedad_suelo: {
          nombre: 'humedad_suelo',
          valor: 2000 + (Math.random() - 0.5) * 1000, // 1500-2500 ADC
          unidad: 'ADC',
          ts: new Date()
        },
        bomba_estado: {
          nombre: 'bomba_estado',
          valor: Math.random() > 0.5 ? 'ENCENDIDA' : 'APAGADA',
          unidad: 'estado',
          ts: new Date()
        }
      };
      setLiveDevices(mockLiveData);
    };

    updateMockData();

    const interval = setInterval(updateMockData, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const flag = localStorage.getItem('esp32_sensors_created');
    if (flag || !canCreate) return;

    const createESP32Sensors = async () => {
      try {
        const sensorsToCreate = [
          {
            tipo_sensor: 'temperatura',
            estado: 'activo',
            valor_minimo: 0,
            valor_maximo: 50,
            unidad_medida: '°C',
            ubicacion: 'ESP32 DHT11'
          },
          {
            tipo_sensor: 'humedad aire',
            estado: 'activo',
            valor_minimo: 0,
            valor_maximo: 100,
            unidad_medida: '%',
            ubicacion: 'ESP32 DHT11'
          },
          {
            tipo_sensor: 'humedad suelo',
            estado: 'activo',
            valor_minimo: 0,
            valor_maximo: 4095,
            unidad_medida: 'ADC',
            ubicacion: 'ESP32 Sensor Suelo'
          }
        ];

        for (const sensorData of sensorsToCreate) {
          try {
            await sensoresService.createSensor(sensorData);
            console.log(`Sensor ${sensorData.tipo_sensor} creado`);
          } catch (e) {
            console.warn(`Sensor ${sensorData.tipo_sensor} ya existe o error:`, e.message);
          }
        }

        alert.success('¡Éxito!', 'Sensores ESP32 configurados correctamente.');
        localStorage.setItem('esp32_sensors_created', '1');
        queryClient.invalidateQueries(['sensores']);
      } catch (e) {
        console.error('Error creando sensores ESP32:', e);
        alert.error('Error', 'No se pudieron crear los sensores ESP32');
      }
    };

    createESP32Sensors();
  }, [queryClient, canCreate, alert, sensors.length]);


  const getSensorIcon = (tipo) => {
    const tipoLower = tipo?.toLowerCase() || '';
    if (tipoLower.includes('temperatura')) return <DeviceThermostat />;
    if (tipoLower.includes('humedad') && tipoLower.includes('suelo')) return <Grass />;
    if (tipoLower.includes('humedad') && tipoLower.includes('aire')) return <WaterDrop />;
    return <DeviceThermostat />;
  };

  const getSensorColor = (tipo) => {
    const tipoLower = tipo?.toLowerCase() || '';
    if (tipoLower.includes('temperatura')) return '#ff6b35';
    if (tipoLower.includes('humedad') && tipoLower.includes('suelo')) return '#4caf50';
    if (tipoLower.includes('humedad') && tipoLower.includes('aire')) return '#2196f3';
    return '#9c27b0';
  };

  const getSensorDisplayName = (tipo, ubicacion) => {
    const tipoLower = tipo?.toLowerCase() || '';
    if (tipoLower.includes('temperatura')) return `🌡️ Temperatura ${ubicacion || 'Sala A'}`;
    if (tipoLower.includes('humedad') && tipoLower.includes('suelo')) return `🌱 Humedad ${ubicacion || 'Suelo'}`;
    if (tipoLower.includes('humedad') && tipoLower.includes('aire')) return `💨 Humedad ${ubicacion || 'Aire'}`;
    return `${tipo} ${ubicacion || ''}`.trim();
  };



  const getSensorStatus = (sensor) => {
    const current = realTimeData[sensor.id]?.valor_actual ?? sensor.valor_actual ?? 0;
    const previous = previousValues[sensor.id];
    const min = sensor.valor_minimo;
    const max = sensor.valor_maximo;

    let trend = 'stable';
    if (previous != null) {
      if (current > previous) trend = 'rising';
      else if (current < previous) trend = 'falling';
    }

    const withinThresholds = current >= min && current <= max;
    const status = withinThresholds ? 'normal' : 'critical';

    return { trend, status, current, previous };
  };



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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <div className="inventory-page">
            <div className="container-header">
              <h1 className="page-title">Dashboard de Sensores IoT</h1>
              <div className="header-actions">
                <Button variant="outlined" onClick={() => setShowManagement(!showManagement)} sx={{ mr: 1 }}>
                  {showManagement ? 'Ocultar Gestión' : 'Mostrar Gestión'}
                </Button>
                {canCreate && (
                  <Button variant="contained" startIcon={<Add />} className="new-inventory-button" onClick={() => handleOpenForm()}>Nuevo Sensor</Button>
                )}
              </div>
            </div>

            {/* Banner de estado crítico */}
            {sensors.some((s) => getSensorStatus(s).status === 'critical') && (
              <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'error.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Alerta: Sensores fuera de rango detectados</Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {sensors.filter((s) => getSensorStatus(s).status === 'critical').map((s) => s.tipo_sensor).join(', ')}
                </Typography>
              </Box>
            )}

            {/* Panel de alertas del sistema */}
            <Box sx={{ mb: 3 }}>
              <AlertPanel />
            </Box>

            {/* Sensor Cards - Horizontal Layout */}
            {sensors.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Panel de Monitoreo en Tiempo Real
                </Typography>
                <Grid container spacing={2}>
                  {sensors.map((sensor) => {
                    const sensorKey = sensor.tipo_sensor.toLowerCase().replace(/\s+/g, '_');
                    const liveData = liveDevices[sensorKey];
                    const realTimeInfo = realTimeData[sensor.id];
                    
                    const currentValue = liveData?.valor ?? realTimeInfo?.valor_actual ?? (sensor.valor_actual || 0);
                    const color = getSensorColor(sensor.tipo_sensor);

                    // Componente de recomendaciones (inline)
                    const RecommendationsBox = ({ id }) => {
                      const { data: recs, isLoading: recLoading } = useQuery({
                        queryKey: ['sensor-recomendaciones', id],
                        queryFn: () => sensoresService.getRecomendaciones(id),
                        refetchOnWindowFocus: false,
                      });
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Recomendaciones</Typography>
                          {recLoading ? (
                            <Typography variant="caption" color="text.secondary">Cargando...</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {(recs || []).slice(0, 3).map((r, idx) => (
                                <Box key={idx} sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.100' }}>
                                  <Typography variant="caption">{r?.mensaje || r}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    };

                    return (
                      <Grid item xs={12} md={4} key={sensor.id}>
                        <Card sx={{
                          height: 140,
                          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                          border: `2px solid ${color}30`,
                          '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.3s ease' }
                        }}>
                          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ color, mr: 1 }}>
                                {getSensorIcon(sensor.tipo_sensor)}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" sx={{ fontWeight: 'bold', color, mb: 0.5 }}>
                                {Number.isFinite(currentValue) ? currentValue.toFixed(1) : '--'}
                                <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
                                  {sensor.unidad_medida || 'unidades'}
                                </Typography>
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {(() => {
                                  const { trend, status } = getSensorStatus(sensor);
                                  const trendIcon = trend === 'rising' ? <TrendingUp fontSize="small" /> : trend === 'falling' ? <TrendingDown fontSize="small" /> : <TrendingFlat fontSize="small" />;
                                  return (
                                    <>
                                      {trendIcon}
                                      <Typography variant="caption" sx={{ ml: 0.5, color: status === 'critical' ? 'error.main' : 'text.secondary' }}>
                                        {trend === 'rising' ? 'Subiendo' : trend === 'falling' ? 'Bajando' : 'Estable'}
                                      </Typography>
                                    </>
                                  );
                                })()}
                              </Box>

                              {/* Recomendaciones por sensor (RF06) */}
                              <RecommendationsBox id={sensor.id} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {sensors.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Visualización de Datos por Sensor
                </Typography>
                <Grid container spacing={3}>
                  {sensors.slice(0, 3).map((sensor, index) => {
                    const sensorKey = sensor.tipo_sensor.toLowerCase().replace(' ', '_');
                    const liveData = liveDevices[sensorKey];
                    const chartColors = ['#ff6b35', '#2196f3', '#4caf50'];
                    const color = chartColors[index] || getSensorColor(sensor.tipo_sensor);

                    const now = new Date();
                    const chartData = [];
                    for (let i = 11; i >= 0; i--) {
                      const time = new Date(now.getTime() - i * 10 * 60 * 1000);
                      let value;
                      if (liveData) {
                        value = liveData.valor + (Math.random() - 0.5) * 2;
                      } else {
                        if (sensor.tipo_sensor.toLowerCase().includes('temperatura')) {
                          value = 25 + Math.random() * 10;
                        } else if (sensor.tipo_sensor.toLowerCase().includes('humedad') && sensor.tipo_sensor.toLowerCase().includes('aire')) {
                          value = 40 + Math.random() * 40;
                        } else if (sensor.tipo_sensor.toLowerCase().includes('humedad') && sensor.tipo_sensor.toLowerCase().includes('suelo')) {
                          value = 1000 + Math.random() * 2000;
                        } else {
                          value = Math.random() * 50 + 20;
                        }
                      }
                      value = Math.max(sensor.valor_minimo, Math.min(sensor.valor_maximo, value));
                      chartData.push({
                        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        value: Number(value.toFixed(1))
                      });
                    }

                    return (
                      <Grid item xs={12} md={4} key={sensor.id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ color, mr: 1 }}>
                                {getSensorIcon(sensor.tipo_sensor)}
                              </Box>
                              {getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                            </Typography>
                            <Box sx={{ height: 120 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={{ fill: color }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {sensors.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Tendencias Históricas y Análisis Profundo
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <TextField
                    label="Fecha Inicio"
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Fecha Fin"
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Tendencias Históricas Combinadas
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(() => {
                          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                          const dataPoints = Math.min(daysDiff, 30);
                          const historicalData = [];
                          for (let i = dataPoints - 1; i >= 0; i--) {
                            const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
                            const dataPoint = { date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) };
                            sensors.slice(0, 3).forEach((sensor, idx) => {
                              const sensorKey = sensor.tipo_sensor.toLowerCase().replace(' ', '_');
                              const liveData = liveDevices[sensorKey];
                              let value;
                              if (liveData) {
                                value = liveData.valor + (Math.random() - 0.5) * 5;
                              } else {
                                if (sensor.tipo_sensor.toLowerCase().includes('temperatura')) {
                                  value = 25 + Math.random() * 10;
                                } else if (sensor.tipo_sensor.toLowerCase().includes('humedad') && sensor.tipo_sensor.toLowerCase().includes('aire')) {
                                  value = 40 + Math.random() * 40;
                                } else if (sensor.tipo_sensor.toLowerCase().includes('humedad') && sensor.tipo_sensor.toLowerCase().includes('suelo')) {
                                  value = 1000 + Math.random() * 2000;
                                } else {
                                  value = Math.random() * 50 + 20;
                                }
                              }
                              value = Math.max(sensor.valor_minimo, Math.min(sensor.valor_maximo, value));
                              dataPoint[`sensor${idx + 1}`] = Number(value.toFixed(1));
                            });
                            historicalData.push(dataPoint);
                          }
                          return historicalData;
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          {sensors.slice(0, 3).map((sensor, idx) => {
                            const colors = ['#ff6b35', '#2196f3', '#4caf50'];
                            const color = colors[idx];
                            return (
                              <Area
                                key={sensor.id}
                                type="monotone"
                                dataKey={`sensor${idx + 1}`}
                                stackId="1"
                                stroke={color}
                                fill={`${color}40`}
                                name={getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                              />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </div>
        </Grid>

      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Gestión de Sensores
        </Typography>

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
                <TableCell>Sensor</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Última Lectura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(liveDevices).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">Esperando lecturas del tópico luixxa/dht11…</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(liveDevices).map(([key, device]) => (
                  <TableRow key={key}>
                    <TableCell>
                      {key === 'temperatura' && '🌡️ Temperatura'}
                      {key === 'humedad_aire' && '💨 Humedad Aire'}
                      {key === 'humedad_suelo' && '🌱 Humedad Suelo'}
                      {key === 'bomba_estado' && '🚰 Bomba de Agua'}
                    </TableCell>
                    <TableCell>
                      {key === 'bomba_estado'
                        ? device.valor
                        : Number.isFinite(device.valor)
                          ? device.valor.toFixed(2)
                          : '-'
                      }
                    </TableCell>
                    <TableCell>{device.unidad}</TableCell>
                    <TableCell>
                      {key === 'bomba_estado' ? (
                        <span style={{
                          color: device.valor === 'ENCENDIDA' ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {device.valor}
                        </span>
                      ) : (
                        <span style={{ color: '#4caf50' }}>Activo</span>
                      )}
                    </TableCell>
                    <TableCell>{device.ts?.toLocaleString?.() || '-'}</TableCell>
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
      </Box>

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
  );
};

export default IotPage;
