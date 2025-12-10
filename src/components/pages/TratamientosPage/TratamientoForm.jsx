import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery } from '@tanstack/react-query';
import insumoService from '../../../services/insumosService';
import epaService from '../../../services/epaService';

const TratamientoForm = ({ open, onClose, onSubmit, epaId, epas = [] }) => {
  const [tratamiento, setTratamiento] = useState({
    descripcion: '',
    dosis: '',
    frecuencia: '',
    tipo: 'Biologico',
    id_epa: epaId || '',
    insumos: []
  });

  useEffect(() => {
    if (epaId) {
      setTratamiento(prev => ({ ...prev, id_epa: epaId }));
    }
  }, [epaId]);

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const response = await insumoService.getInsumos(1, 1000);
      return response || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  console.log('TratamientoForm - epas prop:', epas);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTratamiento(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInsumo = () => {
    setTratamiento(prev => ({
      ...prev,
      insumos: [...prev.insumos, { id_insumo: '', cantidad_usada: '', unidad_medida: '' }]
    }));
  };

  const handleRemoveInsumo = (index) => {
    setTratamiento(prev => ({
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== index)
    }));
  };

  const handleInsumoChange = (index, field, value) => {
    setTratamiento(prev => ({
      ...prev,
      insumos: prev.insumos.map((insumo, i) => 
        i === index ? { ...insumo, [field]: value } : insumo
      )
    }));
  };

  const handleSubmit = () => {
    onSubmit(tratamiento);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Nuevo Tratamiento</DialogTitle>
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

        <FormControl fullWidth margin="dense">
          <InputLabel>EPA</InputLabel>
          <Select
            name="id_epa"
            value={tratamiento.id_epa}
            label="EPA"
            onChange={handleChange}
            disabled={!!epaId}
          >
            {epas.map((epa) => (
              <MenuItem key={epa.id} value={epa.id}>
                {epa.nombre || epa.descripcion || `EPA ${epa.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sección de Insumos */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Insumos Utilizados
          </Typography>
          
          {tratamiento.insumos.map((insumo, index) => (
            <Box key={index} display="flex" gap={2} alignItems="center" mb={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Insumo</InputLabel>
                <Select
                  value={insumo.id_insumo}
                  label="Insumo"
                  onChange={(e) => handleInsumoChange(index, 'id_insumo', e.target.value)}
                >
                  {insumos
                    .filter(i => !i.es_herramienta && i.tipo_insumo !== 'herramienta')
                    .map((i) => (
                      <MenuItem key={i.id} value={i.id}>
                        {i.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                label="Cantidad"
                type="number"
                value={insumo.cantidad_usada}
                onChange={(e) => handleInsumoChange(index, 'cantidad_usada', e.target.value)}
                sx={{ width: 120 }}
              />
              
              <TextField
                size="small"
                label="Unidad"
                value={insumo.unidad_medida}
                onChange={(e) => handleInsumoChange(index, 'unidad_medida', e.target.value)}
                sx={{ width: 100 }}
              />
              
              <IconButton 
                color="error" 
                onClick={() => handleRemoveInsumo(index)}
                disabled={tratamiento.insumos.length === 1}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddInsumo}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          >
            Agregar Insumo
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TratamientoForm;
