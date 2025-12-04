import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button,
  DialogActions,
  Alert,
  Stack
} from '@mui/material';
import { Settings, Save, Cancel } from '@mui/icons-material';
import './ChangeBrokerModal.css';

const ChangeBrokerModal = ({ 
  open, 
  onClose, 
  onSave, 
  currentBroker = 'wss://broker.hivemq.com:8884/mqtt',
  currentTopic = 'luixxa/dht11'
}) => {
  const [formData, setFormData] = useState({
    brokerUrl: '',
    topic: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        brokerUrl: currentBroker,
        topic: currentTopic
      });
      setErrors({});
    }
  }, [open, currentBroker, currentTopic]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.brokerUrl.trim()) {
      newErrors.brokerUrl = 'La URL del broker es requerida';
    } else if (!formData.brokerUrl.startsWith('mqtt://') && !formData.brokerUrl.startsWith('ws://')) {
      newErrors.brokerUrl = 'La URL debe comenzar con mqtt:// o ws://';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'El topic es requerido';
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
      await onSave({
        brokerUrl: formData.brokerUrl.trim(),
        topic: formData.topic.trim()
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving broker configuration:', error);
      setErrors({ submit: 'Error al guardar la configuración. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        brokerUrl: currentBroker,
        topic: currentTopic
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="change-broker-modal"
      aria-describedby="change-broker-modal-description"
      className="change-broker-modal-backdrop"
    >
      <Box
        className="change-broker-modal"
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
        <Box className="modal-header">
          <Settings sx={{ mr: 2, color: '#1976d2', fontSize: '1.5rem' }} />
          <Typography id="change-broker-modal" variant="h5" component="h2" className="modal-title">
            Cambiar Configuración MQTT
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" className="modal-subtitle">
          Modifica la configuración del broker MQTT y el topic para cambiar la fuente de datos de los sensores.
        </Typography>

        <Box className="modal-form-field">
          <TextField
            label="URL del Broker"
            value={formData.brokerUrl}
            onChange={handleInputChange('brokerUrl')}
            error={!!errors.brokerUrl}
            helperText={errors.brokerUrl || 'Ej: mqtt://broker.hivemq.com:1883 o ws://broker.hivemq.com:8884/mqtt'}
            fullWidth
            required
            disabled={loading}
            placeholder="wss://broker.hivemq.com:8884/mqtt"
          />
        </Box>

        <Box className="modal-form-field">
          <TextField
            label="Topic MQTT"
            value={formData.topic}
            onChange={handleInputChange('topic')}
            error={!!errors.topic}
            helperText={errors.topic || 'Topic MQTT del sensor (ej: luixxa/dht11)'}
            fullWidth
            required
            disabled={loading}
            placeholder="luixxa/dht11"
          />
        </Box>

        <Alert severity="info" className="current-config-alert">
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Configuración actual:
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="caption" className="config-item">
              <span className="config-label">Broker:</span> {currentBroker}
            </Typography>
            <Typography variant="caption" className="config-item">
              <span className="config-label">Topic:</span> {currentTopic}
            </Typography>
          </Stack>
        </Alert>

        {errors.submit && (
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            {errors.submit}
          </Typography>
        )}

        <DialogActions className="modal-actions">
          <Button 
            onClick={handleClose} 
            disabled={loading}
            startIcon={<Cancel />}
            className="btn-cancel"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            className="btn-save"
            startIcon={loading ? undefined : <Save />}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default ChangeBrokerModal;