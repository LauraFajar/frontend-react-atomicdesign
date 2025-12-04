import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Alert,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Paper,
  Switch,
  IconButton,
  Divider,
  TextField
} from '@mui/material';
import { 
  Wifi, 
  WifiOff, 
  PictureAsPdf, 
  TableChart, 
  Download, 
  DeviceThermostat, 
  WaterDrop, 
  Grass, 
  ShowChart, 
  PowerSettingsNew,
  ChevronLeft,
  ChevronRight,
  Sensors,
  AcUnit,
  Opacity
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useIotSocket from '../../../hooks/useIotSocket';

const AgroticIotDashboard = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sensorData, setSensorData] = useState({
    temperatura: null,
    humedad_aire: null,
    humedad_suelo_adc: null,
    bomba_estado: null
  });
  const [historicalData, setHistoricalData] = useState({
    temperatura: [],
    humedad_aire: [],
    humedad_suelo: []
  });
  const [selectedSensor, setSelectedSensor] = useState('temperatura');
  const [switchStates, setSwitchStates] = useState({
    sistema: false,
    bomba: false
  });
  const [exporting, setExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [brokerConfig, setBrokerConfig] = useState({
    brokerUrl: 'mqtt://broker.hivemq.com:1883',
    topic: 'luixxa/dht11'
  });

  const { connected, latestReading } = useIotSocket();

  const processSensorData = useCallback((reading) => {
    console.log('📡 Processing real MQTT data:', reading);
    
    setSensorData({
      temperatura: reading.temperatura || reading.temperature,
      humedad_aire: reading.humedad_aire || reading.humidity,
      humedad_suelo_adc: reading.humedad_suelo_adc || reading.soilHumidity,
      bomba_estado: reading.bomba_estado || reading.pumpState
    });

    const timestamp = new Date();
    setHistoricalData(prev => {
      const newData = { ...prev };
      
      if (reading.temperatura || reading.temperature) {
        const temp = parseFloat(reading.temperatura || reading.temperature);
        newData.temperatura = [...newData.temperatura, { timestamp, value: temp }].slice(-50);
      }
      
      if (reading.humedad_aire || reading.humidity) {
        const humidity = parseFloat(reading.humedad_aire || reading.humidity);
        newData.humedad_aire = [...newData.humedad_aire, { timestamp, value: humidity }].slice(-50);
      }
      
      if (reading.humedad_suelo_adc || reading.soilHumidity) {
        const soilAdc = parseFloat(reading.humedad_suelo_adc || reading.soilHumidity);
        const soilPercent = soilAdc > 100 ? Math.round((1 - soilAdc / 4095) * 100) : soilAdc;
        newData.humedad_suelo = [...newData.humedad_suelo, { timestamp, value: soilPercent }].slice(-50);
      }
      
      return newData;
    });

    const pumpState = (reading.bomba_estado || reading.pumpState) === 'ENCENDIDA' || 
                     (reading.bomba_estado || reading.pumpState) === true ||
                     (reading.bomba_estado || reading.pumpState) === 1;
    setSwitchStates(prev => ({
      ...prev,
      bomba: pumpState
    }));
  }, []);

  useEffect(() => {
    if (latestReading && Object.keys(latestReading).length > 0) {
      processSensorData(latestReading);
    }
  }, [latestReading, processSensorData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex(prev => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sensorCards = useMemo(() => [
    {
      id: 'temperatura',
      title: 'Temperatura Ambiente',
      value: sensorData.temperatura,
      unit: '°C',
      icon: <DeviceThermostat />,
      color: '#ff6b35',
      status: sensorData.temperatura ? 'ACTIVO' : 'INACTIVO'
    },
    {
      id: 'humedad_aire',
      title: 'Humedad Ambiente',
      value: sensorData.humedad_aire,
      unit: '%',
      icon: <WaterDrop />,
      color: '#2196f3',
      status: sensorData.humedad_aire ? 'ACTIVO' : 'INACTIVO'
    },
    {
      id: 'humedad_suelo',
      title: 'Humedad del Suelo',
      value: sensorData.humedad_suelo_adc ? 
        (sensorData.humedad_suelo_adc > 100 ? 
          Math.round((1 - sensorData.humedad_suelo_adc / 4095) * 100) : 
          sensorData.humedad_suelo_adc) : null,
      unit: '%',
      icon: <Grass />,
      color: '#4caf50',
      status: sensorData.humedad_suelo_adc ? 'ACTIVO' : 'INACTIVO'
    },
    {
      id: 'bomba',
      title: 'Estado de la Bomba',
      value: sensorData.bomba_estado === 'ENCENDIDA' ? 'ENCENDIDA' : 
             sensorData.bomba_estado === 'APAGADA' ? 'APAGADA' : null,
      unit: '',
      icon: <PowerSettingsNew />,
      color: '#9c27b0',
      status: sensorData.bomba_estado ? 'ACTIVO' : 'INACTIVO',
      isPump: true
    }
  ], [sensorData]);

  const sendMqttCommand = async (command) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      console.log(`📤 Sending MQTT command to luixxa/control: ${command}`);
      
      const response = await fetch(`${baseUrl}/api/iot/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command,
          topic: 'luixxa/control'
        })
      });
      
      const result = await response.json();
      console.log('MQTT command response:', result);
      
      if (command === 'SISTEMA_ON') {
        setSwitchStates(prev => ({ ...prev, sistema: true }));
      } else if (command === 'SISTEMA_OFF') {
        setSwitchStates(prev => ({ ...prev, sistema: false }));
      } else if (command === 'BOMBA_ON') {
        setSwitchStates(prev => ({ ...prev, bomba: true }));
      } else if (command === 'BOMBA_OFF') {
        setSwitchStates(prev => ({ ...prev, bomba: false }));
      }
      
      return result.success;
    } catch (error) {
      console.error('Error sending MQTT command:', error);
      return false;
    }
  };

  const handleSwitchChange = (type, checked) => {
    const command = type === 'sistema' 
      ? (checked ? 'SISTEMA_ON' : 'SISTEMA_OFF')
      : (checked ? 'BOMBA_ON' : 'BOMBA_OFF');
    
    sendMqttCommand(command);
  };

  const handleConfigChange = (field, value) => {
    setBrokerConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyBrokerConfig = async () => {
    try {
      console.log('Applying new broker configuration:', brokerConfig);
      
      alert(`Configuración actualizada:\nBroker: ${brokerConfig.brokerUrl}\nTopic: ${brokerConfig.topic}\n\nNota: Esta funcionalidad requiere implementación del backend`);
      setShowConfig(false);
    } catch (error) {
      console.error('Error applying broker configuration:', error);
      alert('Error al aplicar la configuración');
    }
  };

  const getChartData = () => {
    const timestamps = new Set();
    
    Object.values(historicalData).forEach(sensorHistory => {
      sensorHistory.forEach(item => timestamps.add(item.timestamp.getTime()));
    });
    
    const sortedTimestamps = Array.from(timestamps).sort();
    
    return sortedTimestamps.map(timestamp => {
      const dataPoint = {
        time: new Date(timestamp).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      if (selectedSensor === 'temperatura' || selectedSensor === 'all') {
        const tempData = historicalData.temperatura.find(item => 
          item.timestamp.getTime() === timestamp
        );
        if (tempData) dataPoint['Temperatura (°C)'] = tempData.value;
      }
      
      if (selectedSensor === 'humedad_aire' || selectedSensor === 'all') {
        const humidityData = historicalData.humedad_aire.find(item => 
          item.timestamp.getTime() === timestamp
        );
        if (humidityData) dataPoint['Humedad Ambiente (%)'] = humidityData.value;
      }
      
      if (selectedSensor === 'humedad_suelo' || selectedSensor === 'all') {
        const soilData = historicalData.humedad_suelo.find(item => 
          item.timestamp.getTime() === timestamp
        );
        if (soilData) dataPoint['Humedad Suelo (%)'] = soilData.value;
      }
      
      return dataPoint;
    });
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      console.log('Exporting PDF with real data...');
      
      const response = await fetch(`${baseUrl}/api/iot/export/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        body: null 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agrotic-iot-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF export successful');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`Error al exportar PDF: ${error.message}\n\nVerifique que el backend esté ejecutándose en el puerto 3000`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
      console.log('Exporting Excel with real data...');
      
      const response = await fetch(`${baseUrl}/api/iot/export/excel`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: null 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agrotic-iot-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Excel export successful');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert(`Error al exportar Excel: ${error.message}\n\nVerifique que el backend esté ejecutándose en el puerto 3000`);
    } finally {
      setExporting(false);
    }
  };

  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % sensorCards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex(prev => (prev - 1 + sensorCards.length) % sensorCards.length);
  };

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Main Container */}
      <Box sx={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        width: '100%'
      }}>
        
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#1976d2', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white'
              }}>
                <Sensors />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                AGROTIC IoT Dashboard
              </Typography>
            </Box>
            <Chip
              icon={connected ? <Wifi /> : <WifiOff />}
              label={connected ? "Conectado al ESP32" : "Desconectado"}
              color={connected ? "success" : "error"}
              variant="filled"
              size="large"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Paper>

        {!connected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Esperando datos reales del sensor...
            </Typography>
            <Typography variant="body2">
              Conectando al topic MQTT: luixxa/dht11
            </Typography>
          </Alert>
        )}

        {/* Main Dashboard Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          mb: 3
        }}>
          
          <Card sx={{ 
            height: '400px', 
            borderRadius: 2,
            boxShadow: 3
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Carousel Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Sensores - Tiempo Real
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={prevCard}>
                    <ChevronLeft />
                  </IconButton>
                  <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center' }}>
                    {currentCardIndex + 1}/4
                  </Typography>
                  <IconButton size="small" onClick={nextCard}>
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>

              {/* Carousel Content */}
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    display: 'flex',
                    height: '100%',
                    transition: 'transform 0.5s ease',
                    transform: `translateX(-${currentCardIndex * 100}%)`
                  }}
                >
                  {sensorCards.map((card, index) => (
                    <Box
                      key={card.id}
                      sx={{
                        minWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
                        textAlign: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: card.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          mb: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        {card.icon}
                      </Box>
                      
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {card.title}
                      </Typography>
                      
                      <Typography variant="h3" sx={{ 
                        fontWeight: 'bold', 
                        color: card.color, 
                        mb: 1 
                      }}>
                        {card.value !== null ? `${card.value}${card.unit}` : '--'}
                      </Typography>
                      
                      <Chip
                        label={card.status}
                        color={card.status === 'ACTIVO' ? 'success' : 'error'}
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      {/* Switch Control */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">Control:</Typography>
                        <Switch
                          checked={
                            card.isPump ? switchStates.bomba : switchStates.sistema
                          }
                          onChange={(e) => handleSwitchChange(
                            card.isPump ? 'bomba' : 'sistema', 
                            e.target.checked
                          )}
                          color="primary"
                          disabled={!card.value}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            height: '400px', 
            borderRadius: 2,
            boxShadow: 3
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Graph Filter Buttons */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                mb: 2,
                justifyContent: 'center'
              }}>
                <Chip
                  label="Temperatura"
                  onClick={() => setSelectedSensor('temperatura')}
                  sx={{
                    backgroundColor: selectedSensor === 'temperatura' ? '#ff6b35' : 'transparent',
                    border: '2px solid #ff6b35',
                    color: selectedSensor === 'temperatura' ? 'white' : '#ff6b35',
                    '&:hover': {
                      backgroundColor: selectedSensor === 'temperatura' ? '#ff6b35' : '#ff6b3530'
                    }
                  }}
                />
                <Chip
                  label="Humedad ambiente"
                  onClick={() => setSelectedSensor('humedad_aire')}
                  sx={{
                    backgroundColor: selectedSensor === 'humedad_aire' ? '#2196f3' : 'transparent',
                    border: '2px solid #2196f3',
                    color: selectedSensor === 'humedad_aire' ? 'white' : '#2196f3',
                    '&:hover': {
                      backgroundColor: selectedSensor === 'humedad_aire' ? '#2196f3' : '#2196f330'
                    }
                  }}
                />
                <Chip
                  label="Humedad del suelo"
                  onClick={() => setSelectedSensor('humedad_suelo')}
                  sx={{
                    backgroundColor: selectedSensor === 'humedad_suelo' ? '#4caf50' : 'transparent',
                    border: '2px solid #4caf50',
                    color: selectedSensor === 'humedad_suelo' ? 'white' : '#4caf50',
                    '&:hover': {
                      backgroundColor: selectedSensor === 'humedad_suelo' ? '#4caf50' : '#4caf5030'
                    }
                  }}
                />
                <Chip
                  label="Todos"
                  onClick={() => setSelectedSensor('all')}
                  sx={{
                    backgroundColor: selectedSensor === 'all' ? '#424242' : 'transparent',
                    border: '2px solid #424242',
                    color: selectedSensor === 'all' ? 'white' : '#424242',
                    '&:hover': {
                      backgroundColor: selectedSensor === 'all' ? '#424242' : '#42424230'
                    }
                  }}
                />
              </Box>

              {/* Graph */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {Object.values(historicalData).some(data => data.length > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #ccc',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {selectedSensor === 'temperatura' || selectedSensor === 'all' ? (
                        <Line 
                          type="monotone" 
                          dataKey="Temperatura (°C)" 
                          stroke="#ff6b35" 
                          strokeWidth={2}
                          dot={{ fill: '#ff6b35', strokeWidth: 2, r: 3 }}
                        />
                      ) : null}
                      {selectedSensor === 'humedad_aire' || selectedSensor === 'all' ? (
                        <Line 
                          type="monotone" 
                          dataKey="Humedad Ambiente (%)" 
                          stroke="#2196f3" 
                          strokeWidth={2}
                          dot={{ fill: '#2196f3', strokeWidth: 2, r: 3 }}
                        />
                      ) : null}
                      {selectedSensor === 'humedad_suelo' || selectedSensor === 'all' ? (
                        <Line 
                          type="monotone" 
                          dataKey="Humedad Suelo (%)" 
                          stroke="#4caf50" 
                          strokeWidth={2}
                          dot={{ fill: '#4caf50', strokeWidth: 2, r: 3 }}
                        />
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column'
                  }}>
                    <ShowChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Esperando datos del ESP32 para mostrar gráficas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Topic: luixxa/dht11
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Sensors sx={{ mr: 2, color: '#1976d2', fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Configuración del Broker MQTT
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowConfig(!showConfig)}
                sx={{ fontWeight: 'bold' }}
              >
                {showConfig ? 'Ocultar' : 'Configurar'}
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {!showConfig ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configuración actual del broker y topic MQTT
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Broker: ${brokerConfig.brokerUrl}`} 
                    variant="outlined" 
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    label={`Topic: ${brokerConfig.topic}`} 
                    variant="outlined" 
                    color="secondary"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Modifica la configuración del broker MQTT y el topic para cambiar la fuente de datos
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Broker URL:
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={brokerConfig.brokerUrl}
                      onChange={(e) => handleConfigChange('brokerUrl', e.target.value)}
                      placeholder="mqtt://broker.hivemq.com:1883"
                      helperText="Ejemplo: mqtt://broker.hivemq.com:1883"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Topic:
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={brokerConfig.topic}
                      onChange={(e) => handleConfigChange('topic', e.target.value)}
                      placeholder="luixxa/dht11"
                      helperText="Topic MQTT del sensor (ej: luixxa/dht11)"
                    />
                  </Box>
                </Stack>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={applyBrokerConfig}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Aplicar Configuración
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowConfig(false)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Cancelar
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Nota:</strong> Esta funcionalidad requiere implementación en el backend para aplicar realmente los cambios de configuración.
                    Actualmente solo muestra la interfaz de configuración.
                  </Typography>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Download sx={{ mr: 2, color: '#1976d2', fontSize: '1.5rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Exportación de Reportes
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los reportes incluirán únicamente datos históricos reales recibidos del ESP32 vía MQTT.
              No se utilizarán datos simulados ni valores por defecto.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                onClick={handleExportPdf}
                disabled={exporting}
                sx={{ py: 1.5, px: 3, fontWeight: 'bold' }}
              >
                Exportar PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <TableChart />}
                onClick={handleExportExcel}
                disabled={exporting}
                sx={{ py: 1.5, px: 3, fontWeight: 'bold' }}
              >
                Exportar Excel
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AgroticIotDashboard;