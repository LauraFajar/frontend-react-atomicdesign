import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import { Storage, LocationOn, Analytics } from '@mui/icons-material';
import sublotService from '../../../services/sublotService';
import './SublotStatistics.css';

const SublotStatistics = ({ sublotId }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [sublotId]);

  const loadStatistics = async () => {
    if (!sublotId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await sublotService.getSublotStatistics(sublotId);
      setStatistics(data);
    } catch (error) {
      console.error('Error al cargar estadísticas del sublote:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!sublotId) {
    return null;
  }

  if (loading) {
    return (
      <Card className="statistics-card">
        <CardContent className="statistics-content">
          <div className="loading-container">
            <CircularProgress size={24} />
            <Typography variant="body2" color="textSecondary">
              Cargando estadísticas...
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !statistics) {
    return (
      <Card className="statistics-card">
        <CardContent className="statistics-content">
          <Typography variant="body2" color="error">
            {error || 'No se pudieron cargar las estadísticas'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="statistics-card">
      <CardContent className="statistics-content">
        <div className="statistics-header">
          <Analytics className="statistics-icon" />
          <Typography variant="h6" className="statistics-title">
            Estadísticas del Sublote
          </Typography>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <div className="statistic-item">
              <Storage className="statistic-icon" />
              <div className="statistic-info">
                <Typography variant="h4" className="statistic-value">
                  {statistics?.total_sensores || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Sensores
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <div className="statistic-item">
              <div className="statistic-icon sensor-active">
                <Storage />
              </div>
              <div className="statistic-info">
                <Typography variant="h4" className="statistic-value">
                  {statistics?.sensores_activos || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sensores Activos
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <div className="statistic-item">
              <div className="statistic-icon sensor-inactive">
                <Storage />
              </div>
              <div className="statistic-info">
                <Typography variant="h4" className="statistic-value">
                  {statistics?.sensores_inactivos || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sensores Inactivos
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <div className="statistic-item">
              <LocationOn className="statistic-icon" />
              <div className="statistic-info">
                <Typography variant="h4" className="statistic-value">
                  {statistics?.tipos_sensores || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tipos de Sensores
                </Typography>
              </div>
            </div>
          </Grid>
        </Grid>

        {statistics?.ultima_actividad && (
          <div className="last-activity">
            <Typography variant="body2" color="textSecondary">
              Última actividad: {new Date(statistics.ultima_actividad).toLocaleString()}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SublotStatistics;
