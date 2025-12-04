import SimpleIotPage from './SimpleIotPage';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Add, Wifi, WifiOff } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import SensorCarousel from '../../molecules/SensorCarousel/SensorCarousel';
import AreaChartComponent from '../../molecules/AreaChart/AreaChart';
import SidePanel from '../../molecules/SidePanel/SidePanel';
import AddBrokerModal from '../../molecules/AddBrokerModal/AddBrokerModal';
import iotService from '../../../services/iotService';
import useIotSocket from '../../../hooks/useIotSocket';

class IoTErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('IoT Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card sx={{ maxWidth: 500 }}>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Error en el módulo IoT
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Se produjo un error inesperado. Mostrando datos de demostración.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    try {
      return this.safeRenderChildren(this.props.children);
    } catch (error) {
      console.error('Error rendering children:', error);
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">Error de renderizado</Typography>
          <Typography variant="body2" color="text.secondary">
            Se produjo un error al cargar el componente.
          </Typography>
        </Box>
      );
    }
  }

  safeRenderChildren(children) {
    if (Array.isArray(children)) {
      return children.map((child) => this.safeRenderChild(child, 0));
    }
    return this.safeRenderChild(children, 0);
  }

  safeRenderChild(child) {
    if (React.isValidElement(child)) {
      return child;
    }
    
    if (typeof child === 'object' && child !== null) {
      if (child.$typeof !== undefined || child.type !== undefined) {
        console.warn('Skipping React component object:', child);
        return null;
      }
    }
    
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
      return child;
    }
    
    return null;
  }
}

const ModernIotPage = () => {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showTemp, setShowTemp] = useState(true);
  const [showHum, setShowHum] = useState(true);
  const [showSoil, setShowSoil] = useState(true);
  const [openAddBroker, setOpenAddBroker] = useState(false);
  const [chartData, setChartData] = useState([]);

  const safeChartData = React.useMemo(() => {
    if (!Array.isArray(chartData)) return [];
    
    return chartData.filter(item => {
      return item && 
             typeof item === 'object' && 
             item.constructor === Object && 
             item.$typeof === undefined;
    });
  }, [chartData]);

  const alert = useAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const socket = useIotSocket();

  const safeSelectedSensor = React.useMemo(() => {
    if (!selectedSensor || typeof selectedSensor !== 'object' || selectedSensor === null) {
      return null;
    }
    
    if (selectedSensor.$typeof !== undefined) {
      console.warn('selectedSensor appears to be a React component object, not a plain object');
      return null;
    }
    
    if (selectedSensor.constructor !== Object) {
      console.warn('selectedSensor is not a plain object');
      return null;
    }
     
    return {
      name: typeof selectedSensor.name === 'string' ? selectedSensor.name : 'Sensor sin nombre',
      valor_actual: typeof selectedSensor.valor_actual === 'number' ? selectedSensor.valor_actual : '--',
      unidad_medida: typeof selectedSensor.unidad_medida === 'string' ? selectedSensor.unidad_medida : 'unidades',
      location: typeof selectedSensor.location === 'string' ? selectedSensor.location : 'No asignada',
      crop: typeof selectedSensor.crop === 'string' ? selectedSensor.crop : 'No asignado',
      deviceId: typeof selectedSensor.deviceId === 'string' ? selectedSensor.deviceId : '',
      tipo_sensor: typeof selectedSensor.tipo_sensor === 'string' ? selectedSensor.tipo_sensor : 'unknown'
    };
  }, [selectedSensor]);

  const { data: sensors = [], isLoading: sensorsLoading, error: sensorsError } = useQuery({
    queryKey: ['sensors'],
    queryFn: async () => {
      try {
        const result = await iotService.getAllSensors();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching sensors:', error);
        return [];
      }
    },
    refetchInterval: 10000,
    retry: false, 
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['readings', selectedSensor?.deviceId],
    queryFn: async () => {
      try {
        if (!selectedSensor?.deviceId) return [];
        const result = await iotService.getReadings(selectedSensor.deviceId, 50);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching readings:', error);
        return []; 
      }
    },
    enabled: !!selectedSensor?.deviceId,
    refetchInterval: 5000, 
    retry: false, 
  });

  const handleSensorSelect = (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleFilterChange = (filter, value) => {
    switch (filter) {
      case 'temperature':
        setShowTemp(value);
        break;
      case 'humidity':
        setShowHum(value);
        break;
      case 'soilHumidity':
        setShowSoil(value);
        break;
    }
  };

  useEffect(() => {
    if (readings && readings.length > 0) {
      const validReadings = readings.filter(reading => {
        return reading && 
               typeof reading === 'object' && 
               reading.constructor === Object && 
               reading.$typeof === undefined;
      });
      
      if (validReadings.length > 0) {
        setChartData(validReadings);
      }
    }
  }, [readings]);

  useEffect(() => {
    if (socket.latestReading && typeof socket.latestReading === 'object' && socket.latestReading !== null) {
      const isPlainObject = socket.latestReading.constructor === Object && socket.latestReading.$typeof === undefined;
      
      if (isPlainObject) {
        setChartData(prev => {
          const newData = [...prev, socket.latestReading];
          return newData.slice(-50); 
        });
      }
    }
  }, [socket.latestReading]);

  const getMockSensors = () => [
    {
      _id: '1',
      deviceId: 'sensor-01',
      name: 'Sensor de Temperatura 01',
      tipo_sensor: 'temperatura',
      valor_actual: 24.5,
      unidad_medida: '°C',
      location: 'Invernadero 1',
      crop: 'Tomate'
    },
    {
      _id: '2',
      deviceId: 'sensor-02',
      name: 'Sensor de Humedad Aire 01',
      tipo_sensor: 'humedad aire',
      valor_actual: 65.2,
      unidad_medida: '%',
      location: 'Invernadero 1',
      crop: 'Tomate'
    },
    {
      _id: '3',
      deviceId: 'sensor-03',
      name: 'Sensor de Humedad Suelo 01',
      tipo_sensor: 'humedad suelo',
      valor_actual: 58.7,
      unidad_medida: '%',
      location: 'Invernadero 1',
      crop: 'Tomate'
    }
  ];

  const displaySensors = React.useMemo(() => {
    const validSensors = Array.isArray(sensors) ? sensors : [];
    return validSensors.length > 0 ? validSensors : getMockSensors();
  }, [sensors]);

  const mockCultivoData = {
    cultivo: 'Tomate',
    clima: 'Soleado',
    rendimiento: 85
  };

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const canCreate = isAdmin;

  if (sensorsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Dashboard IoT en Tiempo Real
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={socket.connected ? <Wifi /> : <WifiOff />}
                label={socket.connected ? 'Conectado' : 'Desconectado'}
                color={socket.connected ? 'success' : 'error'}
                variant="outlined"
              />
              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenAddBroker(true)}
                  sx={{ bgcolor: '#1976d2' }}
                >
                  Agregar Broker
                </Button>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Error alert */}
        {sensorsError && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {typeof sensorsError === 'string' 
                ? sensorsError 
                : 'No se pudieron cargar los sensores. Mostrando datos de demostración.'}
            </Alert>
          </Grid>
        )}

        {/* Sensor Carousel */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                Panel de Monitoreo de Sensores
              </Typography>
              <SensorCarousel
                sensors={displaySensors}
                onSelect={handleSensorSelect}
                selectedSensor={safeSelectedSensor}
              />
            </CardContent>
          </Card>

          {/* Area Chart */}
          <AreaChartComponent
            data={safeChartData}
            showTemp={showTemp}
            showHum={showHum}
            showSoil={showSoil}
            onFilterChange={handleFilterChange}
          />
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          <SidePanel
            cultivo={mockCultivoData.cultivo}
            clima={mockCultivoData.clima}
            rendimiento={mockCultivoData.rendimiento}
          />
        </Grid>

        {/* Selected Sensor Details */}
        {safeSelectedSensor && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Detalles del Sensor: {safeSelectedSensor?.name || 'Sensor sin nombre'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f8ff', borderRadius: 1 }}>
                      <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                        {typeof safeSelectedSensor?.valor_actual === 'number' 
                          ? safeSelectedSensor.valor_actual.toFixed(1) 
                          : safeSelectedSensor?.valor_actual || '--'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeSelectedSensor?.unidad_medida || 'unidades'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fff0', borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Ubicación
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeSelectedSensor?.location || 'No asignada'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff8e1', borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Cultivo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeSelectedSensor?.crop || 'No asignado'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Estado
                      </Typography>
                      <Chip
                        label={safeSelectedSensor?.deviceId && socket.isSensorOnline(safeSelectedSensor.deviceId) ? 'Online' : 'Offline'}
                        color={safeSelectedSensor?.deviceId && socket.isSensorOnline(safeSelectedSensor.deviceId) ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Broker Modal */}
      <AddBrokerModal
        open={openAddBroker}
        onClose={() => setOpenAddBroker(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['brokers']);
          alert.success('Éxito', 'Broker creado correctamente');
        }}
      />
    </Box>
  );
};

// Temporarily disabled while using SimpleIotPage
// export default function IotPageWrapper() {
//   return (
//     <ErrorBoundary>
//       <IoTErrorBoundary>
//         <ModernIotPage />
//       </IoTErrorBoundary>
//     </ErrorBoundary>
//   );
// }

// Global error boundary for additional protection
// eslint-disable-next-line no-unused-vars
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error de Aplicación
          </Typography>
          <Typography variant="body1">
            Ha ocurrido un error inesperado. Por favor, recarga la página.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Recargar Página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Use the simpler IoT page by default while ModernIotPage is optional
export default SimpleIotPage;