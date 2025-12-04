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
import iotService from '../../../services/iotService';
import useIotSocket from '../../../hooks/useIotSocket';
import ChangeBrokerModal from '../../../components/molecules/ChangeBrokerModal/ChangeBrokerModal';

const SimpleIotPage = () => {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reportSensor, setReportSensor] = useState('all');
  
  const [sensorHistory, setSensorHistory] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0); 
  const [sensorStates, setSensorStates] = useState({}); 
  
  const [selectedSensors, setSelectedSensors] = useState(['temperatura', 'humedad_aire', 'humedad_suelo_adc']); // Default all selected
  const [pumpState, setPumpState] = useState(false); 
  
  const [openChangeBrokerModal, setOpenChangeBrokerModal] = useState(false);
  const [currentBrokerConfig, setCurrentBrokerConfig] = useState({
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    topic: 'luixxa/dht11'
  });
  
  const { connected, latestReading } = useIotSocket();

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

  useEffect(() => {
    setLoading(false); 
    setError(null);
    console.log('SimpleIotPage initialized - will use data from MQTT topics only');
  }, []);

  const processRealSensorData = useCallback((reading) => {
    const newSensors = [];
    const timestamp = new Date();
    
    console.log(' Processing MQTT reading from WebSocket:', reading);
    
    Object.entries(reading).forEach(([key, value]) => {
      if (value !== undefined && sensorConfigs[key]) {
        const config = sensorConfigs[key];
        let processedValue = value;
        let displayValue = value;
  
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
          rawValue: value,
          color: config.color,
          icon: config.icon
        };
        
        newSensors.push(sensorData);
        
        if (key !== 'bomba_estado') {
          setSensorHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), { 
              timestamp, 
              value: processedValue 
            }].slice(-50)
          }));
        } else {
          const isPumpOn = value === 'ENCENDIDA' || value === true || value === 1 || value === 'ON';
          setPumpState(isPumpOn);
        }
      }
    });
    
    if (newSensors.length > 0) {
      setSensors(newSensors);
      setError(null);
      console.log(`🔄 Updated ${newSensors.length} sensors from MQTT data`);
      
      if (!selectedSensor && newSensors.length > 0) {
        setSelectedSensor(newSensors[0]);
      }
    }
  }, [selectedSensor, sensorConfigs]);
  useEffect(() => {
    if (latestReading && Object.keys(latestReading).length > 0) {
      console.log('✅ Real WebSocket data received from IoT gateway:', latestReading);
      
      processRealSensorData(latestReading);
    }
  }, [latestReading, processRealSensorData]);

  useEffect(() => {
    console.log(`🔌 WebSocket connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  }, [connected]);

  const getUnifiedChartData = () => {
    if (!sensorHistory || Object.keys(sensorHistory).length === 0) return [];
    
    const allTimestamps = new Set();
    Object.values(sensorHistory).forEach(history => {
      history?.forEach(item => allTimestamps.add(item.timestamp.getTime()));
    });
    
    const timestamps = Array.from(allTimestamps).sort();
    
    return timestamps.map(ts => {
      const point = {
        timestamp: new Date(ts),
        time: new Date(ts).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      };
      
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

  const handleSensorFilterChange = (sensorKey) => {
    setSelectedSensors(prev => {
      if (prev.includes(sensorKey)) {
        const newSelection = prev.filter(key => key !== sensorKey);
        const chartSensors = newSelection.filter(key => key !== 'bomba_estado');
        if (chartSensors.length === 0) return prev;
        return newSelection;
      } else {
        return [...prev, sensorKey];
      }
    });
  };

  const handleSelectAllSensors = () => {
    setSelectedSensors(['temperatura', 'humedad_aire', 'humedad_suelo_adc']);
  };

  const sensorKeys = ['temperatura', 'humedad_aire', 'humedad_suelo_adc', 'bomba_estado'];
  
  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % sensorKeys.length);
  };

  const prevCard = () => {
    setCurrentCardIndex(prev => (prev - 1 + sensorKeys.length) % sensorKeys.length);
  };

  const handleToggleSensor = (sensorKey) => {
    setSensorStates(prev => ({
      ...prev,
      [sensorKey]: !prev[sensorKey]
    }));
    console.log(`Sensor ${sensorKey} toggled to: ${!sensorStates[sensorKey]}`);
  };

  const getSensorValue = (sensorKey) => {
    const sensor = sensors.find(s => s._id === sensorKey);
    return sensor?.valor_actual ?? '--';
  };

  const handleBrokerChange = async (newConfig) => {
    try {
      console.log('🔧 Updating broker configuration:', newConfig);
      setCurrentBrokerConfig(newConfig);
      
      alert(`✅ Configuración actualizada exitosamente:\n\nBroker: ${newConfig.brokerUrl}\nTopic: ${newConfig.topic}\n\n⚠️ Nota: La reconexión al nuevo broker requiere implementación del backend.`);
      
      
    } catch (error) {
      console.error('❌ Error updating broker configuration:', error);
      throw error; 
    }
  };



  const downloadBlob = (blob, filename) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log(`✅ Archivo descargado: ${filename}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('No se pudo descargar el archivo');
    }
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
      
      const response = await iotService.exportToPdf(params);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const timestamp = new Date().toISOString().split('T')[0];
      const sensorName = reportSensor !== 'all' ? reportSensor : 'todos-sensores';
      const filename = `agrotic-reporte-iot-${sensorName}-${timestamp}.pdf`;
      
      downloadBlob(blob, filename);
      
      console.log('✅ PDF exportado exitosamente');
      
    } catch (err) {
      console.error('❌ Error exporting PDF:', err);
      const errorMessage = err.response?.status === 404 
        ? 'No se encontraron datos para el rango seleccionado'
        : err.response?.status === 500
        ? 'Error interno del servidor al generar el PDF'
        : err.message || 'Error inesperado al exportar PDF';
      
      setError(errorMessage);
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
      
      const response = await iotService.exportToExcel(params);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const timestamp = new Date().toISOString().split('T')[0];
      const sensorName = reportSensor !== 'all' ? reportSensor : 'todos-sensores';
      const filename = `agrotic-reporte-iot-${sensorName}-${timestamp}.xlsx`;
      
      downloadBlob(blob, filename);
      
      console.log('✅ Excel exportado exitosamente');
      
    } catch (err) {
      console.error('❌ Error exporting Excel:', err);
      const errorMessage = err.response?.status === 404 
        ? 'No se encontraron datos para el rango seleccionado'
        : err.response?.status === 500
        ? 'Error interno del servidor al generar el Excel'
        : err.message || 'Error inesperado al exportar Excel';
      
      setError(errorMessage);
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

        {/* Estado de la Bomba  */}
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
