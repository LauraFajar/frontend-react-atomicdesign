import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useAlert } from '../../../contexts/AlertContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box, Typography, Container, FormControl, InputLabel, Select, MenuItem, TextField, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress, Tooltip } from '@mui/material';
import { Agriculture, Grass, Event } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import calendarService from '../../../services/calendarService';
import cropService from '../../../services/cropService';
import './CalendarPage.css';

const CalendarPage = () => {
  const { user } = useAuth();
  const alert = useAlert();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCrop, setSelectedCrop] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openEventModal, setOpenEventModal] = useState(false);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const { data: crops = [], isError: isCropsError, error: cropsError } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => cropService.getCrops(1, 100),
    select: (data) => data.items || [],
    staleTime: Infinity,
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar los cultivos.');
    }
  });

  const { data: events = [], isLoading, isError, error } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      return calendarService.getCalendarEvents(formatDate(startDate), formatDate(endDate));
    },
    onError: (err) => {
      alert.error('Error de Carga', err.message || 'No se pudieron cargar los eventos del calendario.');
    }
  });

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    if (selectedCrop) {
      filtered = filtered.filter(event => event.id_cultivo === selectedCrop);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(event => new Date(event.fecha) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(event => new Date(event.fecha) <= to);
    }
    return filtered;
  }, [events, selectedCrop, dateFrom, dateTo]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleCropFilter = (event) => {
    setSelectedCrop(event.target.value);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setOpenEventModal(true);
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'siembra': return '#4caf50';
      case 'cosecha': return '#ff9800';
      case 'actividad': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'siembra': return <Grass />;
      case 'cosecha': return <Agriculture />;
      case 'actividad': return <Event />;
      default: return <Event />;
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return filteredEvents.filter(event => event.fecha === dateStr);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return (
          <div className="calendar-tile-events">
            {dayEvents.slice(0, 3).map((event, index) => (
              <Tooltip key={index} title={event.titulo || event.tipo_actividad}>
                <div
                  className="calendar-event-dot"
                  style={{ backgroundColor: getEventColor(event.tipo) }}
                  onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                />
              </Tooltip>
            ))}
            {dayEvents.length > 3 && (
              <div className="calendar-more-events">+{dayEvents.length - 3}</div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const resetFilters = () => {
    setSelectedCrop('');
    setDateFrom(null);
    setDateTo(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <Container maxWidth="lg" className="calendar-page">
      <div className="calendar-header">
        <h1 className="calendar-title">Calendario de Cultivos y Actividades</h1>
      </div>


      <div className="filters-container">
        <Grid container spacing={3} className="filters-grid">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cultivo</InputLabel>
              <Select value={selectedCrop} onChange={handleCropFilter} label="Cultivo">
                <MenuItem value=""><em>Todos los cultivos</em></MenuItem>
                {crops.map(crop => (
                  <MenuItem key={crop.id} value={crop.id}>{crop.tipo_cultivo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker label="Fecha desde" value={dateFrom} onChange={setDateFrom} renderInput={(params) => <TextField {...params} fullWidth />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker label="Fecha hasta" value={dateTo} onChange={setDateTo} renderInput={(params) => <TextField {...params} fullWidth />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="outlined" onClick={resetFilters} fullWidth className="reset-filters-button">Limpiar Filtros</Button>
          </Grid>
        </Grid>
        <div className="filters-summary">
          <Typography variant="body2" color="text.secondary">Mostrando {filteredEvents.length} eventos</Typography>
        </div>
      </div>

      <div className="calendar-container">
        <Calendar onChange={handleDateChange} value={selectedDate} tileContent={tileContent} locale="es" className="react-calendar-custom" />
      </div>

      <div className="legend-container">
        <Typography variant="h6" gutterBottom>Referencia de colores</Typography>
        <Box className="legend-items">
          <Box className="legend-item"><div className="legend-color" style={{ backgroundColor: '#4caf50' }} /><Typography variant="body2">Siembra</Typography></Box>
          <Box className="legend-item"><div className="legend-color" style={{ backgroundColor: '#ff9800' }} /><Typography variant="body2">Cosecha</Typography></Box>
          <Box className="legend-item"><div className="legend-color" style={{ backgroundColor: '#2196f3' }} /><Typography variant="body2">Actividades</Typography></Box>
        </Box>
      </div>

      <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} maxWidth="md" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getEventIcon(selectedEvent.tipo)}
                <Typography variant="h6">{selectedEvent.titulo || selectedEvent.tipo_actividad}</Typography>
                <Chip label={selectedEvent.tipo} style={{ backgroundColor: getEventColor(selectedEvent.tipo) }} size="small" />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Fecha</Typography><Typography variant="body1">{new Date(selectedEvent.fecha).toLocaleDateString('es-ES')}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Cultivo</Typography><Typography variant="body1">{crops.find(c => c.id === selectedEvent.id_cultivo)?.tipo_cultivo || 'N/A'}</Typography></Grid>
                {selectedEvent.descripcion && <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Descripción</Typography><Typography variant="body1">{selectedEvent.descripcion}</Typography></Grid>}
                {selectedEvent.estado && <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Estado</Typography><Typography variant="body1">{selectedEvent.estado}</Typography></Grid>}
                {selectedEvent.responsable && <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary">Responsable</Typography><Typography variant="body1">{selectedEvent.responsable}</Typography></Grid>}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEventModal(false)} sx={{ color: 'var(--primary-green) !important', '& .MuiButton-label': { color: 'white !important' } }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CalendarPage;