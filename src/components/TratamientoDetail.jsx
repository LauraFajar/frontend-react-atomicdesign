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
import './TratamientoDetail.css';

const TratamientoDetail = ({ open, onClose, tratamiento }) => {
  if (!tratamiento) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle className="modal-title">
        Detalle de Tratamiento
      </DialogTitle>
      
      <DialogContent>
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">ID:</Typography>
          <Typography variant="body1" className="detail-value">{tratamiento.id}</Typography>
        </div>
        
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Tipo:</Typography>
          <Chip 
            label={tratamiento.tipo === 'biologico' ? 'Biológico' : 'Químico'} 
            size="small" 
            className={`tipo-chip ${tratamiento.tipo === 'biologico' ? 'biologico' : 'quimico'}`}
          />
        </div>
        
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Descripción:</Typography>
          <Typography variant="body1" className="detail-value">{tratamiento.descripcion}</Typography>
        </div>
        
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Dosis:</Typography>
          <Typography variant="body1" className="detail-value">{tratamiento.dosis}</Typography>
        </div>
        
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Frecuencia:</Typography>
          <Typography variant="body1" className="detail-value">{tratamiento.frecuencia}</Typography>
        </div>
        
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">EPA:</Typography>
          <Chip 
            label={tratamiento.epa_nombre || tratamiento.id_epa} 
            size="small" 
            className="epa-chip"
          />
        </div>
      </DialogContent>
      
      <DialogActions className="dialog-actions">
        <Button 
          variant="outlined" 
          onClick={onClose}
          className="btn-cancel"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TratamientoDetail;