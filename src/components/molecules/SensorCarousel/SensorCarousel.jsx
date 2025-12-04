import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, DeviceThermostat, WaterDrop, Grass } from '@mui/icons-material';

const SensorCarousel = ({ sensors, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (sensors.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === sensors.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sensors.length]);

  const nextSlide = () => {
    setCurrentIndex(currentIndex === sensors.length - 1 ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? sensors.length - 1 : currentIndex - 1);
  };

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

  if (!sensors || sensors.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No hay sensores disponibles
        </Typography>
      </Box>
    );
  }

  const currentSensor = sensors[currentIndex];

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Card 
        sx={{ 
          height: 200,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          },
          background: `linear-gradient(135deg, ${getSensorColor(currentSensor.tipo_sensor)}15, ${getSensorColor(currentSensor.tipo_sensor)}05)`,
          border: `2px solid ${getSensorColor(currentSensor.tipo_sensor)}30`,
        }}
        onClick={() => onSelect(currentSensor)}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: getSensorColor(currentSensor.tipo_sensor), mr: 1 }}>
              {getSensorIcon(currentSensor.tipo_sensor)}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {typeof currentSensor.name === 'string' 
                ? currentSensor.name 
                : 'Sensor sin nombre'}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: getSensorColor(currentSensor.tipo_sensor) }}>
                {typeof currentSensor.valor_actual === 'number' 
                  ? currentSensor.valor_actual.toFixed(1) 
                  : currentSensor.valor_actual || '--'}
              </Typography>
              <Typography variant="caption" sx={{ ml: 1, fontSize: '1rem' }}>
                {typeof currentSensor.unidad_medida === 'string' 
                  ? currentSensor.unidad_medida 
                  : 'unidades'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {typeof currentSensor.location === 'string' 
                ? currentSensor.location 
                : 'No asignada'} 
              {' - '}
              {typeof currentSensor.crop === 'string' 
                ? currentSensor.crop 
                : 'No asignado'}
            </Typography>
            
            <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
              Última actualización: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation arrows */}
      {sensors.length > 1 && (
        <>
          <IconButton
            sx={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
            onClick={prevSlide}
          >
            <ChevronLeft />
          </IconButton>
          
          <IconButton
            sx={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
            }}
            onClick={nextSlide}
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Dots indicator */}
      {sensors.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          {sensors.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? getSensorColor(currentSensor.tipo_sensor) : 'rgba(0, 0, 0, 0.3)',
                mx: 0.5,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SensorCarousel;