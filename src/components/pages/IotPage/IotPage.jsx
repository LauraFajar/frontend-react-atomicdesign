import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Grid, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, IconButton, CircularProgress } from '@mui/material';
import { DeviceThermostat, Grass, WaterDrop, Warning, TrendingUp, TrendingDown, TrendingFlat, Add, Edit, Delete } from '@mui/icons-material';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, AreaChart, Area, Legend } from 'recharts';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import sensoresService from '../../../services/sensoresService';
import cropService from '../../../services/cropService';
import useMQTT from '../../../hooks/useMQTT';
import AlertPanel from '../../../components/widgets/AlertPanel';
import ReportExportButtons from '../../../components/iot/ReportExportButtons';
import ComprehensiveReportExport from '../../../components/iot/ComprehensiveReportExport';
import ConfirmModal from '../../../components/molecules/ConfirmModal/ConfirmModal';

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
            <TextField 
              label="Ubicación/Cultivo" 
              fullWidth 
              value={ubicacion} 
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Cultivo A, Sublote 1"
              helperText="Indica el cultivo y sublote donde está ubicado el sensor"
            />
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
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [historicalMode, setHistoricalMode] = useState('stack'); 
  // Nuevo: tópico activo y métrica seleccionada para historial/reportes
  const [activeTopic, setActiveTopic] = useState('luixxa/dht11');
  const [selectedMetric, setSelectedMetric] = useState('temperatura');
  const [isTopicSubscribed, setIsTopicSubscribed] = useState(false);

  function convertSoilAdcToPercent(adc, min = 0, max = 4095) {
    if (typeof adc !== 'number' || Number.isNaN(adc)) return NaN;
    if (max <= min) return NaN;
    const ratio = (adc - min) / (max - min);
    const pct = (1 - ratio) * 100; // alto ADC = seco => menor %
    return Math.max(0, Math.min(100, Number(pct.toFixed(1))));
  }

  const mqtt = useMQTT({
    url: 'wss://broker.hivemq.com:8884/mqtt',
    topic: 'luixxa/dht11',
    onMessage: (payload) => {
      const now = new Date();
      const temp = Number(payload.temperatura ?? payload.temp ?? payload.temperature ?? NaN);
      const humedadAire = Number(payload.humedad_aire ?? payload.humidity ?? NaN);
      const humedadSueloAdc = Number(payload.humedad_suelo_adc ?? payload.humedad_suelo ?? NaN);
      const humedadSueloPct = Number.isNaN(humedadSueloAdc) ? NaN : convertSoilAdcToPercent(humedadSueloAdc, 0, 4095);
      const bomba = String(payload.bomba_estado ?? '').toUpperCase();
      const live = {};
      if (!Number.isNaN(temp)) live['temperatura'] = { nombre: 'temperatura', valor: temp, unidad: '°C', ts: now };
      if (!Number.isNaN(humedadAire)) live['humedad_aire'] = { nombre: 'humedad_aire', valor: humedadAire, unidad: '%', ts: now };
      if (!Number.isNaN(humedadSueloPct)) live['humedad_suelo'] = { nombre: 'humedad_suelo', valor: humedadSueloPct, unidad: '%', ts: now };
      if (bomba) live['bomba_estado'] = { nombre: 'bomba_estado', valor: bomba, unidad: 'estado', ts: now };
      setLiveDevices(live);
  
      setRtSeries((prev) => {
        const next = { ...prev };
        Object.entries(live).forEach(([key, device]) => {
          const arr = next[key] || [];
          const point = { time: device.ts, value: device.valor };
          next[key] = [...arr, point].slice(-60);
        });
        return next;
      });
    },
    options: { clientId: `web_${Math.random().toString(16).slice(2)}` },
  });
  
  useEffect(() => {
    setMqttStatus(mqtt.connected ? 'connected' : 'disconnected');
  }, [mqtt.connected]);
  
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (Object.keys(liveDevices).length === 0) {
        console.log('MQTT timeout, using mock real-time data');
        const now = new Date();
        const mockLiveDevices = {
          'temperatura': { nombre: 'temperatura', valor: 24.5 + (Math.random() - 0.5) * 4, unidad: '°C', ts: now },
          'humedad_aire': { nombre: 'humedad_aire', valor: 65.2 + (Math.random() - 0.5) * 10, unidad: '%', ts: now },
          'humedad_suelo': { nombre: 'humedad_suelo', valor: 58.7 + (Math.random() - 0.5) * 15, unidad: '%', ts: now },
          'bomba_estado': { nombre: 'bomba_estado', valor: Math.random() > 0.7 ? 'ENCENDIDA' : 'APAGADA', unidad: 'estado', ts: now }
        };
        setLiveDevices(mockLiveDevices);

        setRtSeries((prev) => {
          const next = { ...prev };
          Object.entries(mockLiveDevices).forEach(([ , device]) => {
            const arr = next[device.nombre] || [];
            const point = { time: device.ts, value: device.valor };
            next[device.nombre] = [...arr, point].slice(-60);
          });
          return next;
        });
      }
    }, 30000); // 30 second timeout

    return () => clearTimeout(fallbackTimer);
  }, [liveDevices]);

  // Suscribir al topic al cambiarlo y desuscribir al desmontar
  useEffect(() => {
    let cancelled = false;
    setIsTopicSubscribed(false);
    const run = async () => {
      try {
        await sensoresService.subscribeTopic(activeTopic);
        if (!cancelled) setIsTopicSubscribed(true);
      } catch (e) {
        console.warn('No se pudo suscribir al topic:', e?.message);
        if (!cancelled) setIsTopicSubscribed(false);
      }
    };
    run();
    return () => {
      cancelled = true;
      sensoresService.unsubscribeTopic(activeTopic).catch(() => {});
    };
  }, [activeTopic]);
  const [realTimeData, setRealTimeData] = useState({});
  const [rtSeries, setRtSeries] = useState({}); // buffer de últimas lecturas por clave MQTT
  const [previousValues, setPreviousValues] = useState({});
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [showManagement, setShowManagement] = useState(false);
  const [selectedSensorForReport, setSelectedSensorForReport] = useState(''); // Para reportes
  const [selectedCrop, setSelectedCrop] = useState(''); // Para filtrar por cultivo
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

  // Sensores basados en datos MQTT en tiempo real
  const sensorsFromMqtt = useMemo(() => {
    const mqttSensors = [];

    // Crear sensores virtuales basados en los datos MQTT disponibles
    if (Object.keys(liveDevices).length > 0) {
      Object.entries(liveDevices).forEach(([key, device]) => {
        if (key !== 'bomba_estado') { 
          const sensorData = {
            id: mqttSensors.length + 1,
            tipo_sensor: device.nombre || key,
            estado: 'activo',
            valor_minimo: key === 'humedad_suelo' ? 0 : key === 'temperatura' ? 0 : 0,
            valor_maximo: key === 'humedad_suelo' ? 100 : key === 'temperatura' ? 50 : 100,
            unidad_medida: device.unidad || '%',
            ubicacion: 'Sensor MQTT',
            valor_actual: device.valor,
            ultima_lectura: device.ts?.toISOString()
          };
          mqttSensors.push(sensorData);
        }
      });
    }

    return mqttSensors.length > 0 ? mqttSensors : mockSensors;
  }, [liveDevices, mockSensors]);

  const sensors = sensorsFromMqtt;

  const { data: topics = [] } = useQuery({
    queryKey: ['sensores-topics'],
    queryFn: () => sensoresService.getTopics(),
    refetchInterval: 60000,
    retry: 0,
    onError: (err) => {
      console.warn('Topics API not available, using default topic:', err.message);
    }
  });

  const { data: crops = [] } = useQuery({
    queryKey: ['crops'],
    queryFn: () => cropService.getCrops(1, 100),
    staleTime: 60 * 1000,
    onError: (err) => {
      console.warn('Crops API not available:', err.message);
    }
  });

  const { data: historialData = [] } = useQuery({
     queryKey: ['historial-topic', activeTopic, selectedMetric, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
     queryFn: ({ signal }) => sensoresService.getHistorialByTopic(
       activeTopic,
       {
         metric: selectedMetric,
         limit: 200,
         order: 'asc',
         fecha_desde: startDate.toISOString().split('T')[0],
         fecha_hasta: endDate.toISOString().split('T')[0],
       },
       { signal }
     ),
     enabled: !!activeTopic && !!selectedMetric && isTopicSubscribed,
     refetchInterval: 15000,
     retry: 0,
     onError: (err) => {
       console.warn('Historical data API not available, using mock data:', err.message);
       
       const mockData = [];
       const now = new Date();
       for (let i = 23; i >= 0; i--) {
         const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Last 24 hours
         if (selectedMetric === 'temperatura' || selectedMetric === 'generico') {
           mockData.push({
             fecha: time.toISOString(),
             valor: 22 + Math.random() * 8, // 22-30°C
             tipo_sensor: 'temperatura',
             unidad: '°C'
           });
         }
         if (selectedMetric === 'humedad_aire' || selectedMetric === 'generico') {
           mockData.push({
             fecha: time.toISOString(),
             valor: 50 + Math.random() * 30, // 50-80%
             tipo_sensor: 'humedad aire',
             unidad: '%'
           });
         }
         if (selectedMetric === 'humedad_suelo' || selectedMetric === 'generico') {
           mockData.push({
             fecha: time.toISOString(),
             valor: 40 + Math.random() * 40, // 40-80%
             tipo_sensor: 'humedad suelo',
             unidad: '%'
           });
         }
       }
       return mockData;
     }
   });

  // Filtrar datos históricos según el sensor seleccionado para reportes
  const filteredHistorialData = useMemo(() => {
    if (!historialData || !Array.isArray(historialData)) {
      return [];
    }
    
    if (!selectedSensorForReport || selectedSensorForReport === '') {
      return historialData; 
    }
    
    const selectedSensor = sensors.find(s => s.id === parseInt(selectedSensorForReport));
    if (!selectedSensor) return historialData;
    
    return historialData.filter(item => {
      const itemTipo = item.tipo_sensor || item.tipo || item.metric || '';
      const selectedTipo = selectedSensor.tipo_sensor.toLowerCase();
      
      if (selectedTipo.includes('temperatura')) {
        return itemTipo.toLowerCase().includes('temperatura');
      } else if (selectedTipo.includes('humedad') && selectedTipo.includes('aire')) {
        return itemTipo.toLowerCase().includes('humedad') && itemTipo.toLowerCase().includes('aire');
      } else if (selectedTipo.includes('humedad') && selectedTipo.includes('suelo')) {
        return itemTipo.toLowerCase().includes('humedad') && itemTipo.toLowerCase().includes('suelo');
      }
      
      return true; 
    });
  }, [historialData, selectedSensorForReport, sensors]);

  useEffect(() => {
    if (Array.isArray(topics) && topics.length === 1 && !activeTopic) {
      setActiveTopic(topics[0]);
    }
  }, [topics, activeTopic]);

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
    if (realTimeDataResponse && Array.isArray(realTimeDataResponse)) {
      const map = {};
      realTimeDataResponse.forEach(sensor => {
        map[sensor.id] = sensor;
      });
      const prev = {};
      Object.keys(map).forEach(id => {
        if (realTimeData[id]?.valor_actual != null) {
          prev[id] = realTimeData[id].valor_actual;
        }
      });
      setPreviousValues(prev);
      setRealTimeData(map);
    }
  }, [realTimeDataResponse, realTimeData]);

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
    let icono = '📡';
    
    if (tipoLower.includes('temperatura')) icono = '🌡️';
    if (tipoLower.includes('humedad') && tipoLower.includes('suelo')) icono = '🌱';
    if (tipoLower.includes('humedad') && tipoLower.includes('aire')) icono = '💨';
    
    const ubicacionFormatted = ubicacion ? ` - ${ubicacion}` : '';
    return `${icono} ${tipo}${ubicacionFormatted}`;
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
                <FormControl sx={{ minWidth: 200, mr: 1 }}>
                  <InputLabel id="crop-select-label">Filtrar por Cultivo</InputLabel>
                  <Select
                    labelId="crop-select-label"
                    label="Filtrar por Cultivo"
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Todos los cultivos</em>
                    </MenuItem>
                    {crops.map((crop) => (
                      <MenuItem key={crop.id} value={crop.id}>
                        {crop.nombre_cultivo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    const color = getSensorColor(sensor.tipo_sensor);
                    const currentValue = realTimeData[sensor.id]?.valor_actual ?? (sensor.valor_actual || 0);

                    const RecommendationsBox = () => {
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Recomendaciones</Typography>
                          <Typography variant="caption" color="text.secondary">
                            No disponible en este entorno
                          </Typography>
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
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
                                  {Number.isFinite(currentValue) ? currentValue.toFixed(1) : '--'}
                                </Typography>
                                <Typography variant="caption" sx={{ ml: 0.5 }}>
                                  {sensor.unidad_medida || 'unidades'}
                                </Typography>
                              </Box>

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

                              <RecommendationsBox />
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
                <Box sx={{ mb: 2, maxWidth: 320 }}>
                  <FormControl fullWidth>
                    <InputLabel id="sensor-select-label">Selecciona un sensor</InputLabel>
                    <Select
                      labelId="sensor-select-label"
                      label="Selecciona un sensor"
                      value={selectedSensorId ?? ''}
                      onChange={(e) => setSelectedSensorId(e.target.value || null)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>— Selecciona —</em>
                      </MenuItem>
                      {sensors.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {getSensorDisplayName(s.tipo_sensor, s.ubicacion)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Grid container spacing={3}>
                  {selectedSensorId ? (
                    (() => {
                      const sensor = sensors.find((s) => s.id === selectedSensorId);
                      if (!sensor) return null;
                      const color = getSensorColor(sensor.tipo_sensor);
                      let chartData = [];
                      if (Array.isArray(historialData) && historialData.length > 0) {
                        chartData = historialData.map((entry) => {
                          const fecha = entry?.fecha ?? entry?.timestamp ?? entry?.ts ?? entry?.date;
                          const valueRaw = entry?.valor ?? entry?.value ?? entry?.temperaturaAmbiente ?? entry?.humedadAmbiente ?? entry?.humedadSuelo;
                          const time = fecha ? new Date(fecha) : new Date();
                          const value = Number(valueRaw ?? 0);
                          return {
                            time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                            value,
                          };
                        });
                      } else {
                        const key = toMqttKeyFromTipo(sensor.tipo_sensor);
                        const series = (key && rtSeries[key]) || [];
                        chartData = series.map((p) => ({
                          time: p.time?.toLocaleTimeString?.('es-ES', { hour: '2-digit', minute: '2-digit' }) || '',
                          value: Number(p.value ?? 0),
                        }));
                      }
                      return (
                        <Grid item xs={12} md={6} key={sensor.id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ color, mr: 1 }}>
                                  {getSensorIcon(sensor.tipo_sensor)}
                                </Box>
                                {getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                              </Typography>
                              <Box sx={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })()
                  ) : (
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Selecciona un sensor para visualizar su gráfica.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
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
                {/* Controles de Topic, Métrica y Sensor para Reportes */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <TextField label="Topic" value={activeTopic} onChange={(e) => setActiveTopic(e.target.value)} size="small" />
                  <FormControl size="small">
                    <InputLabel id="metric-label">Métrica</InputLabel>
                    <Select labelId="metric-label" label="Métrica" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} sx={{ minWidth: 180 }}>
                      <MenuItem value="temperatura">temperatura</MenuItem>
                      <MenuItem value="humedad_aire">humedad_aire</MenuItem>
                      <MenuItem value="humedad_suelo">humedad_suelo</MenuItem>
                      <MenuItem value="generico">generico</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="sensor-report-label">Sensor para Reporte</InputLabel>
                    <Select 
                      labelId="sensor-report-label" 
                      label="Sensor para Reporte" 
                      value={selectedSensorForReport} 
                      onChange={(e) => setSelectedSensorForReport(e.target.value)}
                    >
                      <MenuItem value="">📊 Todos los sensores</MenuItem>
                      {sensors.map((sensor) => (
                        <MenuItem key={sensor.id} value={sensor.id}>
                          {getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <ReportExportButtons
                    topic={activeTopic}
                    historialData={Array.isArray(filteredHistorialData) ? filteredHistorialData : []}
                    startDate={startDate}
                    endDate={endDate}
                    sensors={selectedSensorForReport && selectedSensorForReport !== '' ? 
                      sensors.filter(s => s.id === parseInt(selectedSensorForReport)) : 
                      sensors}
                    bombaData={Object.entries(liveDevices)
                      .filter(([key]) => key === 'bomba_estado')
                      .map(([key, device]) => ({
                        fecha: device.ts,
                        estado: device.valor,
                        tipo: 'bomba'
                      }))}
                    selectedSensor={selectedSensorForReport ? 
                      sensors.find(s => s.id === parseInt(selectedSensorForReport)) : 
                      null}
                  />
                </Box>

                {/* Comprehensive Project Report */}
                <Box sx={{ mt: 4 }}>
                  <ComprehensiveReportExport />
                </Box>
                {/* Mostrar mensaje si no hay lecturas */}
                {historialData && Array.isArray(historialData) && historialData.length === 0 && (
                  <AlertPanel type="info" title="Sin datos" message="Sin datos en el rango seleccionado" />
                )}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Tendencias Históricas Combinadas
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                      <FormControl size="small">
                        <InputLabel id="mode-label">Modo</InputLabel>
                        <Select
                          labelId="mode-label"
                          label="Modo"
                          value={historicalMode}
                          onChange={(e) => setHistoricalMode(e.target.value)}
                        >
                          <MenuItem value="stack">Apilado</MenuItem>
                          <MenuItem value="overlay">Superpuesto</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ height: 420 }}>
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
                              const value = liveData && Number.isFinite(liveData.valor) ? liveData.valor : null;
                              if (value !== null) {
                                dataPoint[`sensor${idx + 1}`] = Number(value.toFixed(1));
                              }
                            });
                            historicalData.push(dataPoint);
                          }
                          return historicalData;
                        })()}>
                          <defs>
                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2196f3" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#2196f3" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4caf50" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#4caf50" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                          <YAxis tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                          <Tooltip content={renderHistoricalTooltip} />
                          <Legend verticalAlign="top" height={24} formatter={(value) => value} />
                          {sensors.slice(0, 3).map((sensor, idx) => {
                            const colors = ['#ff6b35', '#2196f3', '#4caf50'];
                            const fills = ['url(#grad1)', 'url(#grad2)', 'url(#grad3)'];
                            const color = colors[idx];
                            const fill = fills[idx];
                            return (
                              <Area
                                key={sensor.id}
                                type="monotone"
                                dataKey={`sensor${idx + 1}`}
                                stackId={historicalMode === 'stack' ? '1' : undefined}
                                stroke={color}
                                strokeWidth={2}
                                fill={fill}
                                name={getSensorDisplayName(sensor.tipo_sensor, sensor.ubicacion)}
                                dot={false}
                                isAnimationActive={true}
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
                    <Typography variant="body2" color="text.secondary">Conectando al broker MQTT o cargando datos mock…</Typography>
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
                <TableCell>Sensor</TableCell>
                <TableCell>Ubicación/Cultivo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Rango</TableCell>
                <TableCell>Última Lectura</TableCell>
                {(canEdit || canDelete) && (<TableCell align="right">Acciones</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7}><CircularProgress /></TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length > 0 ? (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1, color: getSensorColor(s.tipo_sensor) }}>
                          {getSensorIcon(s.tipo_sensor)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {s.tipo_sensor}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          {s.unidad_medida}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {s.ubicacion || <Typography variant="caption" color="warning.main">⚠️ Sin asignar</Typography>}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.ubicacion ? 'Asignado a cultivo' : 'Requiere asignación'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: s.estado === 'activo' ? 'success.main' : 'error.main',
                            mr: 1
                          }}
                        />
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {s.estado}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {s.valor_minimo} - {s.valor_maximo}
                      </Typography>
                    </TableCell>
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
                    <TableCell colSpan={7}>
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


const renderHistoricalTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <Box sx={{ p: 1.5, bgcolor: '#101418', borderRadius: 2, boxShadow: 3, border: '1px solid #1f2937', minWidth: 200 }}>
      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{label}</Typography>
      {payload.map((item, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Box sx={{ width: 8, height: 8, bgcolor: item.color, borderRadius: '50%', mr: 1 }} />
          <Typography variant="body2" sx={{ color: '#E5E7EB' }}>
            {item.name}: <b>{Number(item.value).toFixed(1)}</b>
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const toMqttKeyFromTipo = (tipo) => {
const t = (tipo || '').toLowerCase();
if (t.includes('temperatura')) return 'temperatura';
if (t.includes('humedad') && t.includes('aire')) return 'humedad_aire';
if (t.includes('humedad') && t.includes('suelo')) return 'humedad_suelo';
return null;
};
