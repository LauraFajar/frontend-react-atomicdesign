import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const TratamientoForm = ({ open, onClose, onSubmit, epaId }) => {
  const [tratamiento, setTratamiento] = useState({
    descripcion: '',
    dosis: '',
    frecuencia: '',
    tipo: 'Biologico',
    id_epa: epaId
  });

  useEffect(() => {
    if (epaId) {
      setTratamiento(prev => ({ ...prev, id_epa: epaId }));
    }
  }, [epaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTratamiento(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(tratamiento);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Añadir Nuevo Tratamiento</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="descripcion"
          label="Descripción"
          type="text"
          fullWidth
          variant="outlined"
          value={tratamiento.descripcion}
          onChange={handleChange}
          multiline
          rows={4}
        />
        <TextField
          margin="dense"
          name="dosis"
          label="Dosis"
          type="text"
          fullWidth
          variant="outlined"
          value={tratamiento.dosis}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="frecuencia"
          label="Frecuencia"
          type="text"
          fullWidth
          variant="outlined"
          value={tratamiento.frecuencia}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Tipo</InputLabel>
          <Select
            name="tipo"
            value={tratamiento.tipo}
            label="Tipo"
            onChange={handleChange}
          >
            <MenuItem value="Biologico">Biológico</MenuItem>
            <MenuItem value="Quimico">Químico</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TratamientoForm;
