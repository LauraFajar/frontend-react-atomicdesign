import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import epaService from '../../../services/epaService';
import config from '../../../config/environment';
import { 
  Button, 
  Typography, 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import './EpaDetail.css';

const statusConfig = {
  activo: {
    color: '#2e7d32',
    bgColor: '#e8f5e9'
  },
  inactivo: {
    color: '#d32f2f',
    bgColor: '#ffebee'
  }
};

const typeConfig = {
  enfermedad: {
    color: '#d32f2f',
    bgColor: '#ffebee'
  },
  plaga: {
    color: '#ed6c02',
    bgColor: '#fff3e0'
  },
  arvense: {
    color: '#1976d2',
    bgColor: '#e3f2fd'
  }
};

const EpaDetail = ({ open, epaId, onClose }) => {
  const { data: epa, isLoading, isError, error } = useQuery({
    queryKey: ['epa', epaId],
    queryFn: () => epaService.getEpaById(epaId),
    enabled: !!epaId && open, 
    staleTime: 1000 * 60 * 5, 
  });

  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    if (epa?.imagen_referencia) {
      const raw = epa.imagen_referencia;
      const rel = raw.startsWith('/') ? raw : `/${raw}`;
      const base = (config.api.baseURL || '').replace(/\/$/, '');
      const srcAbs = raw.startsWith('http') ? raw : `${base}${rel}`;
      setImgSrc(srcAbs);
    }
  }, [epa]);

  if (!open) return null;

  const rel = epa?.imagen_referencia ? (epa.imagen_referencia.startsWith('/') ? epa.imagen_referencia : `/${epa.imagen_referencia}`) : '';


  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle className="modal-title">
        Detalles de EPA
      </DialogTitle>
      
            <DialogContent>
        {isLoading ? (
          <Typography>Cargando detalles...</Typography>
        ) : isError ? (
          <Typography color="error">Error al cargar los detalles: {error.message}</Typography>
        ) : !epa ? (
          <Typography>No se encontró la EPA.</Typography>
        ) : (
          <>
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Nombre:</Typography>
          <Typography variant="body1" className="detail-value">{epa.nombre_epa}</Typography>
        </div>

        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Descripción:</Typography>
          <Typography variant="body1" className="detail-value">{epa.descripcion}</Typography>
        </div>

        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Tipo:</Typography>
          <Box>
            <Chip
              label={epa.tipo.charAt(0).toUpperCase() + epa.tipo.slice(1)}
              style={{
                backgroundColor: typeConfig[epa.tipo]?.bgColor || '#e0e0e0',
                color: typeConfig[epa.tipo]?.color || '#333333'
              }}
              className="detail-chip"
            />
          </Box>
        </div>

        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Estado:</Typography>
          <Box>
            <Chip
              label={epa.estado === 'activo' ? 'Activo' : 'Inactivo'}
              style={{
                backgroundColor: statusConfig[epa.estado]?.bgColor || '#e0e0e0',
                color: statusConfig[epa.estado]?.color || '#333333'
              }}
              className="detail-chip"
            />
          </Box>
        </div>

        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Imagen de referencia:</Typography>
          <div style={{ marginTop: '8px' }}>
            {epa.imagen_referencia ? (
              <div className="image-container">
                <img
                  src={imgSrc}
                  alt={`Imagen de ${epa.nombre_epa}`}
                  className="detail-image"
                  onError={() => { setImgSrc(rel); }}
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                />
              </div>
            ) : (
              <div className="no-image-container">
                <Typography variant="body2" color="textSecondary">
                  No hay imagen disponible
                </Typography>
              </div>
            )}
          </div>
        </div>

        <Divider style={{ margin: '20px 0' }} />

        <div className="detail-section">
          <Typography variant="h5" className="detail-label" gutterBottom>Tratamientos Recomendados</Typography>

          {/* Tratamientos Biológicos */}
          <Typography variant="h6" style={{ marginTop: '16px', color: '#2e7d32' }}>Biológicos</Typography>
          {(epa.tratamientos?.filter(t => t.tipo === 'Biologico') || []).length > 0 ? (
            (epa.tratamientos?.filter(t => t.tipo === 'Biologico') || []).map(t => (
              <Card key={t.id_tratamiento} variant="outlined" style={{ marginTop: '8px' }}>
                <CardContent>
                  <Typography variant="body1">{t.descripcion}</Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                    <strong>Dosis:</strong> {t.dosis}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Frecuencia:</strong> {t.frecuencia}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No hay tratamientos biológicos recomendados.</Typography>
          )}

          {/* Tratamientos Químicos */}
          <Typography variant="h6" style={{ marginTop: '16px', color: '#d32f2f' }}>Químicos</Typography>
          {(epa.tratamientos?.filter(t => t.tipo === 'Quimico') || []).length > 0 ? (
            (epa.tratamientos?.filter(t => t.tipo === 'Quimico') || []).map(t => (
              <Card key={t.id_tratamiento} variant="outlined" style={{ marginTop: '8px' }}>
                <CardContent>
                  <Typography variant="body1">{t.descripcion}</Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                    <strong>Dosis:</strong> {t.dosis}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Frecuencia:</strong> {t.frecuencia}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No hay tratamientos químicos recomendados.</Typography>
          )}
        </div>
          </>
        )}
      </DialogContent>
      
      <DialogActions className="dialog-actions">
        <Button 
          variant="contained" 
          onClick={onClose}
          className="btn-save"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EpaDetail;