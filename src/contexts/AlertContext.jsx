import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Alert from '../components/atoms/Alert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

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
};

export default AlertContext;
