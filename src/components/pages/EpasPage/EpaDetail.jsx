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

        {epa.imagen && (
          <div className="detail-section">
            <Typography variant="h6" className="detail-label">Imagen de referencia:</Typography>
            <div className="image-container">
              <img 
                src={epa.imagen} 
                alt={`Imagen de ${epa.nombre}`} 
                className="detail-image" 
              />
            </div>
          </div>
        )}

        {!epa.imagen && (
          <div className="detail-section">
            <Typography variant="h6" className="detail-label">Imagen de referencia:</Typography>
            <div className="no-image-container">
              <Typography variant="body2" color="textSecondary">
                No hay imagen disponible
              </Typography>
            </div>
          </div>
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