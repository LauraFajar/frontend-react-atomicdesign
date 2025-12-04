import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button,
  DialogActions
} from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import iotService from '../../../services/iotService';

const AddBrokerModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
    topics: [''],
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTopicChange = (index) => (event) => {
    const newTopics = [...formData.topics];
    newTopics[index] = event.target.value;
    setFormData(prev => ({
      ...prev,
      topics: newTopics
    }));
  };

  const addTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, '']
    }));
  };

  const removeTopic = (index) => {
    if (formData.topics.length > 1) {
      const newTopics = formData.topics.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        topics: newTopics
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.host.trim()) {
      newErrors.host = 'El host es requerido';
    } else if (!formData.host.startsWith('mqtt://') && !formData.host.startsWith('ws://')) {
      newErrors.host = 'El host debe comenzar con mqtt:// o ws://';
    }

    const validTopics = formData.topics.filter(topic => topic.trim() !== '');
    if (validTopics.length === 0) {
      newErrors.topics = 'Al menos un tópico es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        topics: formData.topics.filter(topic => topic.trim() !== ''),
      };

      await iotService.createBroker(payload);
      
      setFormData({
        name: '',
        host: '',
        username: '',
        password: '',
        topics: [''],
        active: true,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating broker:', error);
      setErrors({ submit: 'Error al crear el broker. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        host: '',
        username: '',
        password: '',
        topics: [''],
        active: true,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-broker-modal"
      aria-describedby="add-broker-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 500,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography id="add-broker-modal" variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
          Agregar Nuevo Broker MQTT
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Nombre del Broker"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Host (mqtt:// o ws://)"
            value={formData.host}
            onChange={handleInputChange('host')}
            error={!!errors.host}
            helperText={errors.host || 'Ej: mqtt://broker.hivemq.com:1883 o ws://broker.hivemq.com:8884'}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Usuario (opcional)"
            value={formData.username}
            onChange={handleInputChange('username')}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Contraseña (opcional)"
            value={formData.password}
            onChange={handleInputChange('password')}
            type="password"
            fullWidth
            disabled={loading}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Tópicos MQTT
            </Typography>
            {errors.topics && (
              <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                {errors.topics}
              </Typography>
            )}
            {formData.topics.map((topic, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label={`Tópico ${index + 1}`}
                  value={topic}
                  onChange={handleTopicChange(index)}
                  placeholder="luixxa/dht11/#"
                  fullWidth
                  size="small"
                  disabled={loading}
                />
                {formData.topics.length > 1 && (
                  <Button
                    onClick={() => removeTopic(index)}
                    disabled={loading}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    <Clear />
                  </Button>
                )}
              </Box>
            ))}
            <Button
              onClick={addTopic}
              disabled={loading}
              startIcon={<Add />}
              size="small"
              variant="outlined"
            >
              Agregar Tópico
            </Button>
          </Box>
        </Box>

        {errors.submit && (
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            {errors.submit}
          </Typography>
        )}

        <DialogActions sx={{ mt: 4, px: 0 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Creando...' : 'Crear Broker'}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default AddBrokerModal;