import React from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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

const EpaDetail = ({ open, epa, onClose }) => {
  if (!epa) return null;

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
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Nombre:</Typography>
          <Typography variant="body1" className="detail-value">{epa.nombre}</Typography>
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
                  src={`http://localhost:3001${epa.imagen_referencia}`}
                  alt={`Imagen de ${epa.nombre}`}
                  className="detail-image"
                  onError={(e) => {
                    console.error('Error loading EPA image:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                />
                <Typography variant="body2" color="textSecondary" style={{ marginTop: '4px' }}>
                  URL: {epa.imagen_referencia}
                </Typography>
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