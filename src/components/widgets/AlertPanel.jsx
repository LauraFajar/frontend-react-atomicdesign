import React from 'react';
import { useAlert } from '../../contexts/AlertContext';
import { Paper, Typography, Chip, List, ListItem, ListItemText, Stack, Box } from '@mui/material';

const severityColor = (sev) => {
  switch (sev) {
    case 'error':
      return '#d32f2f';
    case 'warning':
      return '#ed6c02';
    case 'success':
      return '#2e7d32';
    default:
      return '#1976d2';
  }
};

const AlertPanel = () => {
  const alertCtx = useAlert();
  const { alerts = [], socketConnected } = alertCtx;

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Alertas del Sistema</Typography>
        <Chip label={socketConnected ? 'Conectado' : 'Desconectado'} size="small" color={socketConnected ? 'success' : 'default'} />
      </Stack>
      {alerts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No hay alertas recientes.</Typography>
      ) : (
        <List dense>
          {alerts.slice(-10).reverse().map((a) => (
            <ListItem key={a.id} sx={{ borderLeft: `4px solid ${severityColor(a.severity)}`, mb: 0.5 }}>
              <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.title}</Typography>
                  <Chip label={a.severity} size="small" sx={{ bgcolor: `${severityColor(a.severity)}20`, color: severityColor(a.severity) }} />
                </Box>}
                secondary={<Typography variant="body2">{a.message}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default AlertPanel;