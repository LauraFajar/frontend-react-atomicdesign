import React, { useMemo } from 'react';
import { Box, FormControlLabel, Switch, Card, CardContent, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AreaChartComponent = ({ data, showTemp, showHum, showSoil, onFilterChange }) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
      if (!item || typeof item !== 'object' || item.$typeof !== undefined) {
        return {
          time: 'N/A',
          temperatura: null,
          humedad_ambiente: null,
          humedad_suelo: null,
        };
      }
      
      return {
        time: new Date(item.timestamp || item.fecha).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temperatura: item.temperature || item.temperatura || null,
        humedad_ambiente: item.humidity || item.humedad || null,
        humedad_suelo: item.soilHumidity || item.humedadSuelo || null,
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          p: 1.5, 
          bgcolor: '#101418', 
          borderRadius: 2, 
          boxShadow: 3, 
          border: '1px solid #1f2937',
          minWidth: 200 
        }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
            {label}
          </Typography>
          {payload.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                bgcolor: item.color, 
                borderRadius: '50%', 
                mr: 1 
              }} />
              <Typography variant="body2" sx={{ color: '#E5E7EB' }}>
                {item.name}: <b>{item.value?.toFixed(1)}</b>
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Datos Históricos - Gráfica Tipo Área
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTemp}
                  onChange={(e) => onFilterChange('temperature', e.target.checked)}
                  color="primary"
                />
              }
              label="Temperatura"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showHum}
                  onChange={(e) => onFilterChange('humidity', e.target.checked)}
                  color="primary"
                />
              }
              label="Humedad Ambiente"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showSoil}
                  onChange={(e) => onFilterChange('soilHumidity', e.target.checked)}
                  color="primary"
                />
              }
              label="Humedad Suelo"
            />
          </Box>
        </Box>

        <Box sx={{ height: 320 }}>
          {chartData.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos disponibles para mostrar
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="soilGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#9CA3AF' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#374151' }} 
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#374151' }} 
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Legend 
                  verticalAlign="top" 
                  height={24} 
                  formatter={(value) => value} 
                />
                
                {showTemp && (
                  <Area
                    type="monotone"
                    dataKey="temperatura"
                    stackId="1"
                    stroke="#ff6b35"
                    strokeWidth={2}
                    fill="url(#tempGradient)"
                    name="Temperatura (°C)"
                    dot={false}
                    isAnimationActive={true}
                  />
                )}
                
                {showHum && (
                  <Area
                    type="monotone"
                    dataKey="humedad_ambiente"
                    stackId="1"
                    stroke="#2196f3"
                    strokeWidth={2}
                    fill="url(#humGradient)"
                    name="Humedad Ambiente (%)"
                    dot={false}
                    isAnimationActive={true}
                  />
                )}
                
                {showSoil && (
                  <Area
                    type="monotone"
                    dataKey="humedad_suelo"
                    stackId="1"
                    stroke="#4caf50"
                    strokeWidth={2}
                    fill="url(#soilGradient)"
                    name="Humedad Suelo (%)"
                    dot={false}
                    isAnimationActive={true}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AreaChartComponent;