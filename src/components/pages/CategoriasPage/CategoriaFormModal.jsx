import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const CategoriaFormModal = ({ open, onClose, onSave, initialData = null }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    setNombre(initialData?.nombre ?? '');
    setDescripcion(initialData?.descripcion ?? '');
  }, [initialData]);

  const handleSave = () => {
    onSave({ nombre, descripcion });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Nombre"
          fullWidth
          margin="dense"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: 2 },
            '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary-green)' }
          }}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextField
          label="Descripción"
          fullWidth
          margin="dense"
          variant="outlined"
          multiline
          minRows={2}
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: 2 },
            '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary-green)' }
          }}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--primary-green)',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' }
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            backgroundColor: 'var(--primary-green)',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'var(--dark-green)' }
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoriaFormModal;