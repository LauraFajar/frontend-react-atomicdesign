import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import tratamientoService from '../services/tratamientoService';
import './TratamientoDetail.css';

const TratamientoDetail = ({ open, onClose, tratamiento }) => {
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {

    if (tratamiento && open) {




      
      if (tratamiento.insumos) {
        setInsumos(tratamiento.insumos);
      } else {
        setInsumos([]);
      }
    }
  }, [tratamiento, open]);

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

        {/* Sección de Insumos */}
        <div className="detail-section">
          <Typography variant="h6" className="detail-label">Insumos Utilizados:</Typography>
          {insumos.length > 0 ? (
            <List className="insumos-list">
              {insumos.map((insumo, index) => (
                <ListItem key={index} className="insumo-item">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <ListItemText 
                        primary={insumo.nombre_insumo || `Insumo ID: ${insumo.id_insumo}`}
                        secondary={`Cantidad: ${insumo.cantidad_usada} ${insumo.unidad_medida || 'unidades'}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Chip 
                        label={`${insumo.cantidad_usada} ${insumo.unidad_medida || 'unidades'}`}
                        size="small"
                        className="cantidad-chip"
                      />
                    </Grid>
                  </Grid>
                  {index < insumos.length - 1 && <Divider />}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" className="no-insumos">
              No hay insumos registrados para este tratamiento
            </Typography>
          )}
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