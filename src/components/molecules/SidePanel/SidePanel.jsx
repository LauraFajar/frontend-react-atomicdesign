import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SidePanel = ({ cultivo: cultivoProp, clima: climaProp, rendimiento: rendimientoProp }) => {
  const cultivo = typeof cultivoProp === 'string' ? cultivoProp : 'Sin definir';
  const clima = typeof climaProp === 'string' ? climaProp : 'Desconocido';
  const rendimiento = typeof rendimientoProp === 'number' ? rendimientoProp : 75;
  const rendimientoData = {
    labels: ['Rendimiento', 'Restante'],
    datasets: [
      {
        data: [rendimiento || 75, 100 - (rendimiento || 75)],
        backgroundColor: [
          '#4caf50',
          '#e0e0e0',
        ],
        borderColor: [
          '#388e3c',
          '#bdbdbd',
        ],
        borderWidth: 2,
        cutout: '70%',
      },
    ],
  };

  const rendimientoOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            if (context.dataIndex === 0) {
              return `Rendimiento: ${rendimiento || 75}%`;
            }
            return '';
          },
        },
      },
    },
  };

  const getClimaColor = (clima) => {
    if (!clima) return '#9c27b0';
    const climaLower = clima.toLowerCase();
    if (climaLower.includes('sol') || climaLower.includes('soleado')) return '#ff9800';
    if (climaLower.includes('lluvia') || climaLower.includes('lluvioso')) return '#2196f3';
    if (climaLower.includes('nublado') || climaLower.includes('nube')) return '#607d8b';
    if (climaLower.includes('tormenta') || climaLower.includes('tormentoso')) return '#673ab7';
    return '#4caf50';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Rendimiento del Cultivo */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Rendimiento del Cultivo
          </Typography>
          <Box sx={{ position: 'relative', height: 120 }}>
            <Doughnut data={rendimientoData} options={rendimientoOptions} />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {rendimiento}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Efectividad
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={rendimiento} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: '#4caf50',
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Progreso de crecimiento
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Estado del Clima */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Estado del Clima
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: getClimaColor(clima),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
                fontSize: '24px',
              }}
            >
              {clima?.toLowerCase().includes('sol') || clima?.toLowerCase().includes('soleado') ? '☀️' :
               clima?.toLowerCase().includes('lluvia') || clima?.toLowerCase().includes('lluvioso') ? '🌧️' :
               clima?.toLowerCase().includes('nublado') || clima?.toLowerCase().includes('nube') ? '☁️' :
               clima?.toLowerCase().includes('tormenta') || clima?.toLowerCase().includes('tormentoso') ? '⛈️' :
               '🌤️'}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              {clima}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Condiciones actuales
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Nombre del Cultivo */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Cultivo Actual
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
              {cultivo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipo de cultivo en monitoreo
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 4,
                backgroundColor: '#e0e0e0',
                borderRadius: 2,
                mt: 2,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Métricas adicionales */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Métricas Rápidas
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Sensores Activos</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>3/3</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Brokers Online</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>2/2</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Última Actualización</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SidePanel;