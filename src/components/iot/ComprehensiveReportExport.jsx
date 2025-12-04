import React, { useState } from 'react';
import {
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Divider,
  TextField
} from '@mui/material';
import {
  Assessment,
  PictureAsPdf,
  TableChart,
  Visibility,
  Timeline,
  Agriculture,
  Inventory,
  AttachMoney,
  Notifications,
  BarChart,
  PieChart,
  ShowChart,
  Description,
  Summarize
} from '@mui/icons-material';
import { useAlert } from '../../contexts/AlertContext';
import sensoresService from '../../services/sensoresService';

const ComprehensiveReportExport = () => {
  const alert = useAlert();
  const [openDialog, setOpenDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Report configuration
  const [reportConfig, setReportConfig] = useState({
    formato: 'pdf',
    fecha_desde: '',
    fecha_hasta: '',
    cultivos: [],
    incluir_actividades: true,
    incluir_finanzas: true,
    incluir_inventario: true,
    incluir_iot: true,
    incluir_alertas: true,
    incluir_mano_obra: true,
    incluir_trazabilidad: true
  });

  // Mock available crops (in real app, this would come from API)
  const cultivosDisponibles = [
    { id: 1, nombre: 'Tomate' },
    { id: 2, nombre: 'Lechuga' },
    { id: 3, nombre: 'Cebolla' },
    { id: 4, nombre: 'Zanahoria' }
  ];

  const reportComponents = [
    {
      key: 'incluir_actividades',
      label: 'Historial de Actividades',
      description: 'Registro cronológico de todas las acciones realizadas',
      icon: <Timeline />,
      color: '#1976d2'
    },
    {
      key: 'incluir_trazabilidad',
      label: 'Trazabilidad de Cultivos',
      description: 'Datos completos del ciclo productivo y condiciones ambientales',
      icon: <Agriculture />,
      color: '#4caf50'
    },
    {
      key: 'incluir_finanzas',
      label: 'Control Financiero',
      description: 'Estado de ingresos, egresos y flujo de caja detallado',
      icon: <AttachMoney />,
      color: '#2e7d32'
    },
    {
      key: 'incluir_mano_obra',
      label: 'Costos por Mano de Obra',
      description: 'Horas trabajadas, costos unitarios y distribución por actividades',
      icon: <ShowChart />,
      color: '#ff9800'
    },
    {
      key: 'incluir_inventario',
      label: 'Inventario de Insumos',
      description: 'Stock actual, movimientos de entrada/salida y niveles de reposición',
      icon: <Inventory />,
      color: '#ff5722'
    },
    {
      key: 'incluir_iot',
      label: 'Datos de Sensores IoT',
      description: 'Información de temperatura, humedad y sistema de riego',
      icon: <Agriculture />,
      color: '#9c27b0'
    },
    {
      key: 'incluir_alertas',
      label: 'Alertas del Sistema',
      description: 'Notificaciones críticas y de seguimiento',
      icon: <Notifications />,
      color: '#d32f2f'
    }
  ];

  const reportFormats = [
    { value: 'pdf', label: 'PDF - Reporte Completo', icon: <PictureAsPdf />, description: 'Documento profesional con diseño corporativo' },
    { value: 'excel', label: 'Excel - Múltiples Pestañas', icon: <TableChart />, description: 'Organizado por categorías en hojas separadas' }
  ];

  const handleConfigChange = (key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCultivosChange = (event) => {
    const value = event.target.value;
    setReportConfig(prev => ({
      ...prev,
      cultivos: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const getSelectedComponentsCount = () => {
    return reportComponents.filter(comp => reportConfig[comp.key]).length;
  };

  const downloadBlobResponse = (response, filename) => {
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const generateComprehensiveReport = async (format) => {
    setIsExporting(true);

    try {
      const params = {
        fecha_desde: reportConfig.fecha_desde || undefined,
        fecha_hasta: reportConfig.fecha_hasta || undefined,
        cultivos: reportConfig.cultivos.length > 0 ? reportConfig.cultivos.join(',') : undefined,
        incluir_actividades: reportConfig.incluir_actividades,
        incluir_finanzas: reportConfig.incluir_finanzas,
        incluir_inventario: reportConfig.incluir_inventario,
        incluir_iot: reportConfig.incluir_iot,
        incluir_alertas: reportConfig.incluir_alertas,
        incluir_mano_obra: reportConfig.incluir_mano_obra,
        incluir_trazabilidad: reportConfig.incluir_trazabilidad
      };

      const endpoint = format === 'excel'
        ? '/api/iot/report/comprehensive/excel'
        : '/api/iot/report/comprehensive/pdf';

      // Make request to backend
      const response = await sensoresService.makeRequest(endpoint, 'GET', params);

      const filename = `reporte-completo-agrotic-${new Date().toISOString().split('T')[0]}.${format}`;
      downloadBlobResponse(response, filename);

      alert.success('Éxito', `Reporte completo generado en formato ${format.toUpperCase()}`);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      const status = error?.response?.status;

      if (status === 404) {
        alert.warning('Sin datos', 'No se encontraron datos para generar el reporte');
      } else if (status === 401) {
        alert.error('Autenticación', 'Sesión expirada. Por favor, inicie sesión nuevamente');
      } else {
        alert.error('Error', 'No se pudo generar el reporte. Intente nuevamente.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewReport = async () => {
    try {
      const params = {
        fecha_desde: reportConfig.fecha_desde || undefined,
        fecha_hasta: reportConfig.fecha_hasta || undefined,
        cultivos: reportConfig.cultivos.length > 0 ? reportConfig.cultivos.join(',') : undefined,
        incluir_actividades: reportConfig.incluir_actividades,
        incluir_finanzas: reportConfig.incluir_finanzas,
        incluir_inventario: reportConfig.incluir_inventario,
        incluir_iot: reportConfig.incluir_iot,
        incluir_alertas: reportConfig.incluir_alertas,
        incluir_mano_obra: reportConfig.incluir_mano_obra,
        incluir_trazabilidad: reportConfig.incluir_trazabilidad,
        formato: 'pdf'
      };

      const response = await sensoresService.makeRequest('/api/iot/report/comprehensive', 'GET', params);

      // Open preview in new window
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      alert.info('Previsualización', 'El reporte se ha abierto en una nueva ventana');
    } catch (error) {
      console.error('Error previewing report:', error);
      alert.error('Error', 'No se pudo generar la previsualización');
    }
  };

  return (
    <>
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment color="primary" />
            Reporte Completo del Proyecto
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Genera un reporte integral que incluye datos de todas las áreas del proyecto:
            actividades, trazabilidad de cultivos, control financiero, costos de mano de obra,
            inventario de insumos y datos de sensores IoT.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<Assessment />}
            onClick={() => setOpenDialog(true)}
            sx={{ mb: 2 }}
          >
            Generar Reporte Completo
          </Button>

          <Alert severity="info" sx={{ mt: 2 }}>
            💡 <strong>Tip:</strong> Los reportes incluyen análisis comparativos, resúmenes ejecutivos
            y estadísticas detalladas de todas las áreas del proyecto.
          </Alert>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={() => !isExporting && setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          Configuración del Reporte Completo
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Date Range */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                📅 Período del Reporte
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Fecha Desde"
                  type="date"
                  value={reportConfig.fecha_desde}
                  onChange={(e) => handleConfigChange('fecha_desde', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Fecha Hasta"
                  type="date"
                  value={reportConfig.fecha_hasta}
                  onChange={(e) => handleConfigChange('fecha_hasta', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Box>

            {/* Crop Selection */}
            <FormControl fullWidth>
              <InputLabel>Cultivos a Incluir</InputLabel>
              <Select
                multiple
                value={reportConfig.cultivos}
                onChange={handleCultivosChange}
                label="Cultivos a Incluir"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const cultivo = cultivosDisponibles.find(c => c.id.toString() === value);
                      return (
                        <Chip key={value} label={cultivo?.nombre || `Cultivo ${value}`} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                <MenuItem value="">
                  <em>Todos los cultivos</em>
                </MenuItem>
                {cultivosDisponibles.map((cultivo) => (
                  <MenuItem key={cultivo.id} value={cultivo.id.toString()}>
                    {cultivo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Report Components */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                📊 Componentes del Reporte
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                {reportComponents.map((component) => (
                  <Card
                    key={component.key}
                    variant="outlined"
                    sx={{
                      border: reportConfig[component.key] ? `2px solid ${component.color}` : '1px solid #e0e0e0',
                      background: reportConfig[component.key] ? `${component.color}10` : 'transparent'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportConfig[component.key]}
                            onChange={(e) => handleConfigChange(component.key, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ color: component.color }}>
                              {component.icon}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {component.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {component.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Format Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                📄 Formato de Exportación
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {reportFormats.map((format) => (
                  <Card
                    key={format.value}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      cursor: 'pointer',
                      border: reportConfig.formato === format.value ? `2px solid #1976d2` : '1px solid #e0e0e0',
                      background: reportConfig.formato === format.value ? '#e3f2fd' : 'transparent'
                    }}
                    onClick={() => handleConfigChange('formato', format.value)}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Box sx={{ color: '#1976d2', mb: 1 }}>
                        {format.icon}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {format.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Report Summary */}
            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                📋 Resumen del Reporte:
              </Typography>
              <Typography variant="body2">
                • {getSelectedComponentsCount()} componentes seleccionados
              </Typography>
              <Typography variant="body2">
                • Formato: {reportConfig.formato.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                • Período: {reportConfig.fecha_desde || 'Inicio'} a {reportConfig.fecha_hasta || 'Actual'}
              </Typography>
              <Typography variant="body2">
                • Cultivos: {reportConfig.cultivos.length === 0 ? 'Todos' : reportConfig.cultivos.length + ' seleccionados'}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handlePreviewReport}
            startIcon={<Visibility />}
            disabled={isExporting || getSelectedComponentsCount() === 0}
          >
            Vista Previa
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            onClick={() => setOpenDialog(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={() => generateComprehensiveReport(reportConfig.formato)}
            disabled={isExporting || getSelectedComponentsCount() === 0}
            startIcon={isExporting ? <CircularProgress size={20} /> :
                     (reportConfig.formato === 'pdf' ? <PictureAsPdf /> : <TableChart />)}
          >
            {isExporting ? 'Generando...' : `Descargar ${reportConfig.formato.toUpperCase()}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ComprehensiveReportExport;