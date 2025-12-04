import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent,
  Alert,
  Chip,
  CircularProgress,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Paper,
  IconButton
} from '@mui/material';
import { Wifi, WifiOff, PictureAsPdf, TableChart, Download, DeviceThermostat, WaterDrop, Grass, ShowChart, PowerSettingsNew, ChevronLeft, ChevronRight, Settings } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// eslint-disable-next-line no-unused-vars
import iotService from '../../../services/iotService';
import useIotSocket from '../../../hooks/useIotSocket';
import ChangeBrokerModal from '../../../components/molecules/ChangeBrokerModal/ChangeBrokerModal';
import { downloadBlob } from '../../../utils/downloadFile';

const SimpleIotPage = () => {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Report filters
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reportSensor, setReportSensor] = useState('all');
  
  const [sensorHistory, setSensorHistory] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // Carousel index
  const [sensorStates, setSensorStates] = useState({}); // Sensor on/off states
  
  // New sensor selection state for unified graph
  const [selectedSensors, setSelectedSensors] = useState(['temperatura', 'humedad_aire', 'humedad_suelo_adc']); // Default all selected
  const [pumpState, setPumpState] = useState(false); // Pump state from MQTT
  
  // Broker configuration state
  const [openChangeBrokerModal, setOpenChangeBrokerModal] = useState(false);
  const [currentBrokerConfig, setCurrentBrokerConfig] = useState({
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    topic: 'luixxa/dht11'
  });
  
  const { connected, latestReading } = useIotSocket();

  // Sensor configurations - using useMemo for stable reference
  const sensorConfigs = useMemo(() => ({
    temperatura: {
      name: 'Temperatura ambiente',
      tipo_sensor: 'temperatura',
      unit: '°C',
      color: '#ff6b35',
      icon: <DeviceThermostat />
    },
    humedad_aire: {
      name: 'Humedad ambiente',
      tipo_sensor: 'humedad aire',
      unit: '%',
      color: '#2196f3',
      icon: <WaterDrop />
    },
    humedad_suelo_adc: {
      name: 'Humedad del suelo',
      tipo_sensor: 'humedad suelo',
      unit: '%',
      color: '#4caf50',
      icon: <Grass />
    },
    bomba_estado: {
      name: 'Estado de la bomba',
      tipo_sensor: 'bomba',
      unit: '',
      color: '#9c27b0',
      icon: <PowerSettingsNew />
    }
  }), []);

  // Initialize app - don't load sensors from DB, only use MQTT data
  useEffect(() => {
    setLoading(false); // We're not loading from DB anymore
    setError(null);
    console.log('SimpleIotPage initialized - will use data from MQTT topics only');
  }, []);

  // Process real sensor data from MQTT/WebSocket
  // IMPORTANT: This function processes data directly from MQTT topics via WebSocket
  // NO se usan sensores de la base de datos - solo datos en tiempo real del broker
  const processRealSensorData = useCallback((reading) => {
    const newSensors = [];
    const timestamp = new Date();
    
    console.log(' Processing MQTT reading from WebSocket:', reading);
    
    // Process each property from the topic data
    Object.entries(reading).forEach(([key, value]) => {
      if (value !== undefined && sensorConfigs[key]) {
        const config = sensorConfigs[key];
        let processedValue = value;
        let displayValue = value;
        
        // Special processing for specific sensors
      
        
        const sensorData = {
          _id: key,
          deviceId: key,
          name: config.name,
          tipo_sensor: config.tipo_sensor,
          valor_actual: displayValue,
          unidad_medida: config.unit,
          location: 'DHT11',
          crop: 'Invernadero',
          topic: 'luixxa/dht11',
          lastUpdate: timestamp,
          rawValue: value, // Store original value
          color: config.color,
          icon: config.icon
        };
        
        newSensors.push(sensorData);
        
        // Update history for graph (use deviceId as key) - skip pump for history
        // NOTE: We store history for charting, but this is still from MQTT data, not DB
        if (key !== 'bomba_estado') {
          setSensorHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), { 
              timestamp, 
              value: processedValue 
            }].slice(-50)
          }));
        } else {
          // Update pump state from MQTT data
          const isPumpOn = value === 'ENCENDIDA' || value === true || value === 1 || value === 'ON';
          setPumpState(isPumpOn);
        }
      }
    });
    
    if (newSensors.length > 0) {
      // UPDATE: Replace all sensors with MQTT data (no DB data used)
      setSensors(newSensors);
      setError(null);
      console.log(`🔄 Updated ${newSensors.length} sensors from MQTT data`);
      
      // Auto-select first sensor if none selected
      if (!selectedSensor && newSensors.length > 0) {
        setSelectedSensor(newSensors[0]);
      }
    }
  }, [selectedSensor, sensorConfigs]);

  // Process real WebSocket data if available
  useEffect(() => {
    if (latestReading && Object.keys(latestReading).length > 0) {
      console.log('✅ Real WebSocket data received from IoT gateway:', latestReading);
      
      // Process real reading using MQTT data only (no DB)
      processRealSensorData(latestReading);
    }
  }, [latestReading, processRealSensorData]);

  // Debug WebSocket connection status
  useEffect(() => {
    console.log(`🔌 WebSocket connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  }, [connected]);



  // Get unified chart data for multiple sensors
  const getUnifiedChartData = () => {
    if (!sensorHistory || Object.keys(sensorHistory).length === 0) return [];
    
    // Get all timestamps
    const allTimestamps = new Set();
    Object.values(sensorHistory).forEach(history => {
      history?.forEach(item => allTimestamps.add(item.timestamp.getTime()));
    });
    
    // Create unified data array
    const timestamps = Array.from(allTimestamps).sort();
    
    return timestamps.map(ts => {
      const point = {
        timestamp: new Date(ts),
        time: new Date(ts).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      };
      
      // Add data for each selected sensor
      selectedSensors.forEach(sensorKey => {
        const history = sensorHistory[sensorKey];
        if (history) {
          const historyItem = history.find(item => 
            item.timestamp.getTime() === ts
          );
          if (historyItem) {
            const sensorName = sensorConfigs[sensorKey]?.name || sensorKey;
            point[sensorName] = historyItem.value;
          }
        }
      });
      
      return point;
    });
  };

  // Handle sensor selection for unified graph
  const handleSensorFilterChange = (sensorKey) => {
    setSelectedSensors(prev => {
      if (prev.includes(sensorKey)) {
        // Remove sensor
        const newSelection = prev.filter(key => key !== sensorKey);
        // Don't allow empty selection for chart sensors
        const chartSensors = newSelection.filter(key => key !== 'bomba_estado');
        if (chartSensors.length === 0) return prev;
        return newSelection;
      } else {
        // Add sensor
        return [...prev, sensorKey];
      }
    });
  };

  const handleSelectAllSensors = () => {
    // Select all sensors for chart (excluding pump from chart display)
    setSelectedSensors(['temperatura', 'humedad_aire', 'humedad_suelo_adc']);
  };

  // Carousel navigation
  const sensorKeys = ['temperatura', 'humedad_aire', 'humedad_suelo_adc', 'bomba_estado'];
  
  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % sensorKeys.length);
  };

  const prevCard = () => {
    setCurrentCardIndex(prev => (prev - 1 + sensorKeys.length) % sensorKeys.length);
  };

  // Toggle sensor state
  const handleToggleSensor = async (sensorKey) => {
    const nextState = !(sensorStates[sensorKey]);
    setSensorStates(prev => ({
      ...prev,
      [sensorKey]: nextState
    }));
    console.log(`Sensor ${sensorKey} toggled to: ${nextState}`);

    // Control de bomba vía backend/MQTT
    if (sensorKey === 'bomba_estado') {
      const command = nextState ? 'BOMBA_ON' : 'BOMBA_OFF';
      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      try {
        const resp = await fetch(`${baseUrl}/api/iot/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, topic: 'luixxa/control' })
        });
        const result = await resp.json().catch(() => ({}));
        if (resp.ok && (result.success !== false)) {
          setPumpState(nextState);
          console.log(`✅ Bomba ${nextState ? 'ENCENDIDA' : 'APAGADA'} (comando ${command})`);
        } else {
          setSensorStates(prev => ({ ...prev, [sensorKey]: !nextState }));
          setError('No se pudo enviar comando a la bomba (backend/MQTT)');
        }
      } catch (e) {
        setSensorStates(prev => ({ ...prev, [sensorKey]: !nextState }));
        console.error('Error enviando comando MQTT:', e);
        setError('Error al enviar comando MQTT');
      }
    }
  };

  // Get current sensor value from sensors array
  const getSensorValue = (sensorKey) => {
    const sensor = sensors.find(s => s._id === sensorKey);
    return sensor?.valor_actual ?? '--';
  };

  // Handle broker configuration change
  const handleBrokerChange = async (newConfig) => {
    try {
      console.log('🔧 Updating broker configuration:', newConfig);
      
      // Update local configuration
      setCurrentBrokerConfig(newConfig);
      
      // In a real implementation, this would reconnect to the new broker
      // For now, we'll just show a success message
      alert(`✅ Configuración actualizada exitosamente:\n\nBroker: ${newConfig.brokerUrl}\nTopic: ${newConfig.topic}\n\n⚠️ Nota: La reconexión al nuevo broker requiere implementación del backend.`);
      
      // You could also trigger a page reload or call a service to reconnect
      // window.location.reload(); // Uncomment if you want to reload the page
      
    } catch (error) {
      console.error('❌ Error updating broker configuration:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };



  // Usando downloadBlob compartido desde utils/downloadFile

  const isPdfBlob = async (blob) => {
    try {
      const arr = new Uint8Array(await blob.arrayBuffer());
      const header = String.fromCharCode(arr[0], arr[1], arr[2], arr[3]);
      return header === '%PDF';
    } catch {
      return false;
    }
  };
  
  const isXlsxBlob = async (blob) => {
    try {
      const arr = new Uint8Array(await blob.arrayBuffer());
      const header = String.fromCharCode(arr[0], arr[1]);
      return header === 'PK';
    } catch {
      return false;
    }
  };
  
  const buildQuery = (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, v);
      }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      setError(null);

      const params = {
        sensor: reportSensor !== 'all' ? reportSensor : undefined,
        fecha_desde: fechaInicio || undefined,
        fecha_hasta: fechaFin || undefined,
      };
      console.log('📤 Exportando PDF con parámetros:', params);

      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      const qs = buildQuery(params);
      const response = await fetch(`${baseUrl}/api/iot/export/pdf${qs}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
      });

      if (!response.ok) {
        const msg = response.status === 404
          ? 'No se encontraron datos para el rango seleccionado'
          : response.status === 500
          ? 'Error interno del servidor al generar el PDF'
          : `HTTP error ${response.status}`;
        throw new Error(msg);
      }

      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/pdf')) {
        throw new Error('El servidor no devolvió un PDF (Content-Type inválido)');
      }

      const blob = await response.blob();
      if (!(await isPdfBlob(blob))) {
        throw new Error('Firma PDF inválida; posible HTML/JSON devuelto por el servidor');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const sensorName = reportSensor !== 'all' ? reportSensor : 'todos-sensores';
      const filename = `agrotic-reporte-iot-${sensorName}-${timestamp}.pdf`;

      const ok = downloadBlob(blob, filename);
      if (!ok) throw new Error('Fallo al descargar el PDF');

      console.log('✅ PDF exportado exitosamente');
    } catch (err) {
      console.error('❌ Error exporting PDF:', err);
      setError(err.message || 'Error inesperado al exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setError(null);

      const params = {
        sensor: reportSensor !== 'all' ? reportSensor : undefined,
        fecha_desde: fechaInicio || undefined,
        fecha_hasta: fechaFin || undefined,
      };
      console.log('📤 Exportando Excel con parámetros:', params);

      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      const qs = buildQuery(params);
      const response = await fetch(`${baseUrl}/api/iot/export/excel${qs}`, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      });

      if (!response.ok) {
        const msg = response.status === 404
          ? 'No se encontraron datos para el rango seleccionado'
          : response.status === 500
          ? 'Error interno del servidor al generar el Excel'
          : `HTTP error ${response.status}`;
        throw new Error(msg);
      }

      const ct = (response.headers.get('content-type') || '').toLowerCase();
      const isExcelType = ct.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || ct.includes('application/zip');
      if (!isExcelType) {
        throw new Error('El servidor no devolvió un XLSX (Content-Type inválido)');
      }

      const blob = await response.blob();
      if (!(await isXlsxBlob(blob))) {
        throw new Error('Firma ZIP inválida; posible HTML/JSON devuelto por el servidor');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const sensorName = reportSensor !== 'all' ? reportSensor : 'todos-sensores';
      const filename = `agrotic-reporte-iot-${sensorName}-${timestamp}.xlsx`;

      const ok = downloadBlob(blob, filename);
      if (!ok) throw new Error('Fallo al descargar el Excel');

      console.log('✅ Excel exportado exitosamente');
    } catch (err) {
      console.error('❌ Error exporting Excel:', err);
      setError(err.message || 'Error inesperado al exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa', 
      minHeight: '100vh',
      padding: 1
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: 'none'
      }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Dashboard IoT
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={connected ? <Wifi /> : <WifiOff />}
                label={connected ? "Conectado" : "Desconectado"}
                color={connected ? "success" : "error"}
                variant="filled"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={() => setOpenChangeBrokerModal(true)}
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  borderColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                    color: 'white'
                  }
                }}
              >
                Cambiar Broker
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Alert */}
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Dashboard Grid Layout */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%'
        }}>
          
          {/* Fila 1: Sensores - Tiempo Real (Carrusel) */}
          <Card sx={{ 
            height: "320px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column"
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              {/* Header con navegación */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Sensores – Tiempo Real
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={prevCard}>
                    <ChevronLeft />
                  </IconButton>
                  <Typography variant="body2" sx={{ minWidth: '40px', textAlign: 'center' }}>
                    {currentCardIndex + 1}/4
                  </Typography>
                  <IconButton size="small" onClick={nextCard}>
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Carrusel de sensores */}
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : !connected ? (
                  <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Esperando conexión al broker MQTT...
                    </Typography>
                    <Typography variant="caption" color="error.main" sx={{ mt: 1 }}>
                      ⚠ Desconectado
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      height: '100%',
                      transition: 'transform 0.4s ease',
                      transform: `translateX(-${currentCardIndex * 100}%)`
                    }}
                  >
                    {sensorKeys.map((sensorKey) => {
                      const config = sensorConfigs[sensorKey];
                      const value = getSensorValue(sensorKey);
                      const isActive = sensorStates[sensorKey] !== false;
                      
                      return (
                        <Box
                          key={sensorKey}
                          sx={{
                            minWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                            textAlign: 'center'
                          }}
                        >
                          {/* Icono del sensor */}
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              backgroundColor: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              mb: 2,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {config.icon}
                          </Box>
                          
                          {/* Nombre del sensor */}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {config.name}
                          </Typography>
                          
                          {/* Valor */}
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: config.color, mb: 1 }}>
                            {sensorKey === 'bomba_estado' 
                              ? (value === 'ENCENDIDA' ? 'ON' : value === 'APAGADA' ? 'OFF' : '--')
                              : `${value}${config.unit}`
                            }
                          </Typography>
                          
                          {/* Estado */}
                          <Chip
                            label={value !== '--' ? 'ACTIVO' : 'INACTIVO'}
                            color={value !== '--' ? 'success' : 'error'}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          
                          {/* Botón Activar/Desactivar */}
                          <Button
                            variant={isActive ? "contained" : "outlined"}
                            color={isActive ? "success" : "error"}
                            size="small"
                            onClick={() => handleToggleSensor(sensorKey)}
                            startIcon={<PowerSettingsNew />}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {isActive ? 'Activado' : 'Desactivado'}
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>



          {/* Gráficas de Sensores (unificada con filtros) */}
          <Card sx={{ 
            height: "320px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gridColumn: "2"
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              
              {/* Título principal */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2, textAlign: 'center' }}>
                📈 Gráficas de Sensores
              </Typography>

              {/* Botones de filtro */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: 1,
                mb: 2
              }}>
                <Chip
                  label="Temperatura ambiente"
                  size="medium"
                  onClick={() => handleSensorFilterChange('temperatura')}
                  sx={{
                    backgroundColor: selectedSensors.includes('temperatura') ? sensorConfigs.temperatura.color : 'transparent',
                    border: `2px solid ${sensorConfigs.temperatura.color}`,
                    color: selectedSensors.includes('temperatura') ? 'white' : sensorConfigs.temperatura.color,
                    fontSize: '0.7rem',
                    height: 28,
                    '&:hover': {
                      backgroundColor: selectedSensors.includes('temperatura') ? sensorConfigs.temperatura.color : sensorConfigs.temperatura.color + '20',
                    }
                  }}
                />
                <Chip
                  label="Humedad ambiente"
                  size="medium"
                  onClick={() => handleSensorFilterChange('humedad_aire')}
                  sx={{
                    backgroundColor: selectedSensors.includes('humedad_aire') ? sensorConfigs.humedad_aire.color : 'transparent',
                    border: `2px solid ${sensorConfigs.humedad_aire.color}`,
                    color: selectedSensors.includes('humedad_aire') ? 'white' : sensorConfigs.humedad_aire.color,
                    fontSize: '0.7rem',
                    height: 28,
                    '&:hover': {
                      backgroundColor: selectedSensors.includes('humedad_aire') ? sensorConfigs.humedad_aire.color : sensorConfigs.humedad_aire.color + '20',
                    }
                  }}
                />
                <Chip
                  label="Humedad del suelo"
                  size="medium"
                  onClick={() => handleSensorFilterChange('humedad_suelo_adc')}
                  sx={{
                    backgroundColor: selectedSensors.includes('humedad_suelo_adc') ? sensorConfigs.humedad_suelo_adc.color : 'transparent',
                    border: `2px solid ${sensorConfigs.humedad_suelo_adc.color}`,
                    color: selectedSensors.includes('humedad_suelo_adc') ? 'white' : sensorConfigs.humedad_suelo_adc.color,
                    fontSize: '0.7rem',
                    height: 28,
                    '&:hover': {
                      backgroundColor: selectedSensors.includes('humedad_suelo_adc') ? sensorConfigs.humedad_suelo_adc.color : sensorConfigs.humedad_suelo_adc.color + '20',
                    }
                  }}
                />
                <Chip
                  label="Estado de la bomba"
                  size="medium"
                  onClick={() => handleSensorFilterChange('bomba_estado')}
                  sx={{
                    backgroundColor: selectedSensors.includes('bomba_estado') ? sensorConfigs.bomba_estado.color : 'transparent',
                    border: `2px solid ${sensorConfigs.bomba_estado.color}`,
                    color: selectedSensors.includes('bomba_estado') ? 'white' : sensorConfigs.bomba_estado.color,
                    fontSize: '0.7rem',
                    height: 28,
                    '&:hover': {
                      backgroundColor: selectedSensors.includes('bomba_estado') ? sensorConfigs.bomba_estado.color : sensorConfigs.bomba_estado.color + '20',
                    }
                  }}
                />
                <Chip
                  label="Todos"
                  size="medium"
                  onClick={handleSelectAllSensors}
                  sx={{
                    backgroundColor: selectedSensors.length === 3 ? '#424242' : 'transparent',
                    border: `2px solid #424242`,
                    color: selectedSensors.length === 3 ? 'white' : '#424242',
                    fontSize: '0.7rem',
                    height: 28,
                    '&:hover': {
                      backgroundColor: selectedSensors.length === 3 ? '#424242' : '#42424220',
                    }
                  }}
                />
              </Box>

              {/* Gráfica dinámica */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {selectedSensors.filter(key => key !== 'bomba_estado').length > 0 ? (
                  <Box sx={{ height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getUnifiedChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 8 }}
                          interval="preserveStartEnd"
                          stroke="#666"
                        />
                        <YAxis 
                          tick={{ fontSize: 8 }}
                          domain={['auto', 'auto']}
                          stroke="#666"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#f5f5f5', 
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            fontSize: '0.7rem'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                        {selectedSensors.filter(key => key !== 'estado_bomba').map(sensorKey => {
                          const config = sensorConfigs[sensorKey];
                          const dataKey = config?.name;
                          return dataKey ? (
                            <Line 
                              key={sensorKey}
                              type="monotone" 
                              dataKey={dataKey}
                              stroke={config.color}
                              strokeWidth={4}
                              dot={{ fill: config.color, strokeWidth: 3, r: 3 }}
                              activeDot={{ r: 5, stroke: config.color, strokeWidth: 2 }}
                              name={`${config.name} (${config.unit})`}
                              isAnimationActive={true}
                              animationDuration={750}
                            />
                          ) : null;
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                    <Box>
                      <ShowChart sx={{ fontSize: 24, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Selecciona sensores para ver la gráfica
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Estado de la Bomba - Below both carousel and graph */}
        <Box sx={{ mt: 2 }}>
          <Card sx={{ 
            height: "150px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column"
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                💧 Estado de la Bomba
              </Typography>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: pumpState ? '#4caf50' : '#f44336',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <PowerSettingsNew sx={{ fontSize: 20 }} />
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: pumpState ? '#4caf50' : '#f44336', mb: 0.5 }}>
                  {pumpState ? 'ENCENDIDA' : 'APAGADA'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {pumpState ? 'Irrigando' : 'Listo para operar'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Report Export Section */}
        <Card sx={{ borderRadius: 2, boxShadow: 3, mt: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Download sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Exportar Reportes
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2} alignItems="center">
              {/* Sensor Selection */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.7rem' }}>Sensor</InputLabel>
                  <Select
                    value={reportSensor}
                    label="Sensor"
                    onChange={(e) => setReportSensor(e.target.value)}
                  >
                    <MenuItem value="all" sx={{ fontSize: '0.7rem' }}>Todos</MenuItem>
                    {sensors.map((sensor) => (
                      <MenuItem key={sensor._id} value={sensor._id} sx={{ fontSize: '0.7rem' }}>
                        {sensor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.7rem' } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.7rem' } }}
                />
              </Grid>

              {/* Export Buttons */}
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={0.5}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={exporting ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdf />}
                    onClick={handleExportPdf}
                    disabled={exporting}
                    sx={{ flex: 1, py: 0.5, fontSize: '0.7rem', fontWeight: 'bold' }}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={exporting ? <CircularProgress size={12} color="inherit" /> : <TableChart />}
                    onClick={handleExportExcel}
                    disabled={exporting}
                    sx={{ flex: 1, py: 0.5, fontSize: '0.7rem', fontWeight: 'bold' }}
                  >
                    Excel
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              * Fechas vacías = todos los datos disponibles
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Change Broker Modal */}
      <ChangeBrokerModal
        open={openChangeBrokerModal}
        onClose={() => setOpenChangeBrokerModal(false)}
        onSave={handleBrokerChange}
        currentBroker={currentBrokerConfig.brokerUrl}
        currentTopic={currentBrokerConfig.topic}
      />
    </Box>
  );
};

export default SimpleIotPage;
