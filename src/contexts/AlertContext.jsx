import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Alert from '../components/atoms/Alert';
import { io } from 'socket.io-client';
import config from '../config/environment';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const addAlert = useCallback(({ severity = 'info', title, message, autoHideDuration = 6000 }) => {
    const id = uuidv4();
    setAlerts((prevAlerts) => [
      ...prevAlerts,
      { id, severity, title, message, autoHideDuration },
    ]);
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  }, []);

  useEffect(() => {
    // Conexión al gateway de alertas del backend (socket.io)
    const socket = io(config.api.baseURL, {
      transports: ['websocket'],
      path: '/socket.io',
      withCredentials: true,
    });

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('newAlert', (payload) => {
      try {
        const severity = payload?.severity || 'warning';
        const sensorName = payload?.sensor?.tipo_sensor || payload?.sensor?.tipo || 'Sensor';
        const valueStr = payload?.valor != null ? String(payload.valor) : '';
        const title = payload?.title || `Alerta de ${sensorName}`;
        const message = payload?.message || `${sensorName} fuera de rango ${valueStr}`;
        addAlert({ severity, title, message, autoHideDuration: 8000 });
      } catch (e) {
        addAlert({ severity: 'warning', title: 'Alerta', message: 'Nueva alerta recibida', autoHideDuration: 6000 });
      }
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('newAlert');
      socket.disconnect();
    };
  }, [addAlert]);

  const alertFunctions = {
    success: (title, message, options) =>
      addAlert({ severity: 'success', title, message, ...options }),
    error: (title, message, options) =>
      addAlert({ severity: 'error', title, message, ...options }),
    warning: (title, message, options) =>
      addAlert({ severity: 'warning', title, message, ...options }),
    info: (title, message, options) =>
      addAlert({ severity: 'info', title, message, ...options }),
    remove: removeAlert,
    alerts,
    socketConnected,
  };

  return (
    <AlertContext.Provider value={alertFunctions}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1400,
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px'
        }}
      >
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            open={true}
            onClose={() => removeAlert(alert.id)}
            severity={alert.severity}
            title={alert.title}
            message={alert.message}
            autoHideDuration={alert.autoHideDuration}
            sx={{ mb: 1 }}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export default AlertContext;
