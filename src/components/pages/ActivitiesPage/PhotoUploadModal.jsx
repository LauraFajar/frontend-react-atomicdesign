import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, CircularProgress } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import activityService from '../../../services/activityService';
import { useAlert } from '../../../contexts/AlertContext';


const PhotoUploadModal = ({ open, onClose, onSave, activity }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('El archivo es demasiado grande. El límite es 5MB.');
        setFile(null);
        setPreview(null);
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setError('');
    }
  };

  const handleSave = async () => {
    if (!file) {
      setError('Por favor, selecciona una imagen.');
      return;
    }
    if (!description.trim()) {
      setError('Por favor, añade una descripción.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await activityService.uploadPhoto(activity.id, { file, description });
      onSave();
      handleClose();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al subir la foto.');
      alert.error('Error', err.message || 'Ocurrió un error al subir la foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fotodocumentar Actividad</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>{activity?.tipo_actividad}</Typography>
        
        <Box sx={{ my: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            sx={{
              color: 'var(--primary-green)',
              borderColor: 'var(--primary-green)',
              '&:hover': {
                borderColor: 'var(--primary-green)',
                backgroundColor: 'rgba(46, 125, 50, 0.04)'
              }
            }}
          >
            Seleccionar Imagen
            <input
              type="file"
              hidden
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
            />
          </Button>
        </Box>

        {preview && (
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <img src={preview} alt="Vista previa" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />
          </Box>
        )}

        <TextField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
          required
          sx={{
            '& label.Mui-focused': {
              color: 'var(--primary-green)',
            },
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: 'var(--primary-green)',
              },
            },
          }}
        />

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ color: 'var(--primary-green)' }}>Cancelar</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          sx={{
            backgroundColor: 'var(--primary-green)',
            '&:hover': {
              backgroundColor: 'darkgreen'
            }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoUploadModal;