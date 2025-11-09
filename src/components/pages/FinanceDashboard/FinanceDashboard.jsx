import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Divider, Chip, Alert, Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab } from '@mui/material';
import dayjs from 'dayjs';
import financeService from '../../../services/financeService';
import cropService from '../../../services/cropService';
import './FinanceDashboard.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const numberFmt = (v) => {
  try {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
  } catch {
    return String(v);
  }
};

const groupOptions = [
  { label: 'Mes', value: 'mes' },
  { label: 'Semana', value: 'semana' },
  { label: 'Día', value: 'dia' },
];

const FinanceDashboard = () => {
  const [cultivoId, setCultivoId] = useState('');
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [groupBy, setGroupBy] = useState('mes');
  const [tipo, setTipo] = useState('todos');
  const [criterio, setCriterio] = useState('bc');
  const [umbral, setUmbral] = useState(1);
  const [tab, setTab] = useState(0);

  const { data: cropsData = { items: [] } } = useQuery({
    queryKey: ['crops', 1, 100],
    queryFn: () => cropService.getCrops(1, 100),
    staleTime: 60 * 1000,
  });

  const resumenQuery = useQuery({
    queryKey: ['finanzasResumen', cultivoId, from, to, groupBy, tipo],
    queryFn: () => financeService.getResumen({ cultivoId, from, to, groupBy, tipo }),
    enabled: Boolean(cultivoId),
  });

  const rentabilidadQuery = useQuery({
    queryKey: ['finanzasRentabilidad', cultivoId, from, to, criterio, umbral],
    queryFn: () => financeService.getRentabilidad({ cultivoId, from, to, criterio, umbral }),
    enabled: Boolean(cultivoId),
  });

  const margenListaQuery = useQuery({
    queryKey: ['finanzasMargenLista', from, to],
    queryFn: () => financeService.getMargenLista({ from, to }),
  });

  const resumen = resumenQuery.data || { ingresosTotal: '0', egresosTotal: '0', margenTotal: '0', series: [], categoriasGasto: [] };

  // Normaliza la serie proveniente del backend para gráficos
  const chartData = useMemo(() => {
    const series = Array.isArray(resumen.series) ? resumen.series : [];
    return series.map((s) => {
      const ingresos = parseFloat(s?.ingresos ?? s?.ingreso ?? s?.total_ingresos ?? 0) || 0;
      const egresos = parseFloat(s?.egresos ?? s?.egreso ?? s?.total_egresos ?? 0) || 0;
      const margen = parseFloat(s?.margen ?? ingresos - egresos) || 0;
      const name = s?.periodo ?? s?.label ?? s?.fecha ?? s?.period ?? s?.name ?? '';
      return { name, ingresos, egresos, margen };
    });
  }, [resumen]);

  const topCategorias = useMemo(() => {
    const cats = Array.isArray(resumen.categoriasGasto) ? resumen.categoriasGasto : [];
    const sorted = [...cats].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    const top5 = sorted.slice(0, 5);
    const otrosTotal = sorted.slice(5).reduce((acc, it) => acc + parseFloat(it.total || '0'), 0);
    return otrosTotal > 0 ? [...top5, { nombre: 'Otros', total: String(otrosTotal) }] : top5;
  }, [resumen]);

  const margenRows = useMemo(() => {
    const d = margenListaQuery.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.items)) return d.items;
    if (Array.isArray(d?.data)) return d.data;
    return [];
  }, [margenListaQuery.data]);

  const rankingData = useMemo(() => {
    const rows = margenRows;
    return rows.map((r) => {
      const ingresos = parseFloat(r.ingresos || 0);
      const egresos = parseFloat(r.egresos || 0);
      const margen = parseFloat(r.margen || (ingresos - egresos));
      const bc = egresos > 0 ? ingresos / egresos : null;
      const rentable = bc !== null ? bc > (parseFloat(umbral) || 1) : margen > 0;
      return { nombre: r.nombre_cultivo || r.cultivo || r.nombre, margen, bc, rentable };
    });
  }, [margenRows, umbral]);

  const handleExport = async (type) => {
    if (!cultivoId) return;
    try {
      const params = { cultivoId, from, to, groupBy, tipo };
      const blob = type === 'excel'
        ? await financeService.exportExcel(params)
        : await financeService.exportPdf(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'excel' ? `finanzas_${cultivoId}_${from}_${to}.xlsx` : `finanzas_${cultivoId}_${from}_${to}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando reporte:', e);
      alert('No fue posible exportar el reporte');
    }
  };

  const cropItems = Array.isArray(cropsData?.items) ? cropsData.items : (Array.isArray(cropsData) ? cropsData : []);
  const cropItemsNormalized = useMemo(() => (
    cropItems.map((c) => ({ id: c.id ?? c.id_cultivo, nombre: c.nombre_cultivo ?? c.nombre }))
  ), [cropItems]);

  useEffect(() => {
    if (!cultivoId && cropItemsNormalized.length > 0) {
      setCultivoId(cropItemsNormalized[0].id);
    }
  }, [cultivoId, cropItemsNormalized]);

  return (
    <div className="dashboard-content finance-dashboard">
      <div className="container-header">
        <h1 className="page-title">Control Financiero</h1>
      </div>
      {resumenQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No fue posible obtener el resumen financiero. Verifica que el backend exponga <code>/finanzas/resumen</code> en {process.env.REACT_APP_API_URL || 'config.api.baseURL'}.
        </Alert>
      )}
      <Paper className="filters-card" elevation={1}>
        <Box className="filters-row">
          <FormControl size="small" className="filter-item">
            <InputLabel id="cultivo-label">Cultivo</InputLabel>
            <Select labelId="cultivo-label" value={cultivoId} label="Cultivo" onChange={(e) => setCultivoId(e.target.value)}>
              {cropItemsNormalized.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
          <FormControl size="small" className="filter-item">
            <InputLabel id="groupby-label">Grupo</InputLabel>
            <Select labelId="groupby-label" value={groupBy} label="Grupo" onChange={(e) => setGroupBy(e.target.value)}>
              {groupOptions.map((g) => (
                <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" className="filter-item">
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select labelId="tipo-label" value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="ingreso">Ingresos</MenuItem>
              <MenuItem value="egreso">Egresos</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" className="filter-item">
            <InputLabel id="criterio-label">Criterio</InputLabel>
            <Select labelId="criterio-label" value={criterio} label="Criterio" onChange={(e) => setCriterio(e.target.value)}>
              <MenuItem value="margen">Margen</MenuItem>
              <MenuItem value="bc">B/C</MenuItem>
              <MenuItem value="porcentaje">% Margen</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Umbral" type="number" value={umbral} onChange={(e) => setUmbral(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'var(--primary-green)',
              color: '#fff',
              '&:hover': { backgroundColor: 'var(--primary-green)' }
            }}
            disabled={!cultivoId}
            onClick={() => resumenQuery.refetch()}
          >
            APLICAR
          </Button>
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          sx={{ '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-green)' } }}
        >
          <Tab label="Resumen" disableRipple sx={{ color: 'var(--primary-green)', '&.Mui-selected': { color: 'var(--primary-green)', fontWeight: 600 } }} />
          <Tab label="Ranking" disableRipple sx={{ color: 'var(--primary-green)', '&.Mui-selected': { color: 'var(--primary-green)', fontWeight: 600 } }} />
          <Tab label="Exportaciones" disableRipple sx={{ color: 'var(--primary-green)', '&.Mui-selected': { color: 'var(--primary-green)', fontWeight: 600 } }} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <div className="content-grid">
          <div className="left-panel">
            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Ingresos vs Egresos</Typography>
              <Divider sx={{ my: 1 }} />
              <div className="chart-container">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2e7d32" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#d32f2f" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para graficar</div>
                )}
              </div>
            </Paper>

            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Margen por período</Typography>
              <Divider sx={{ my: 1 }} />
              <div className="chart-container">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="margen" name="Margen" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para graficar</div>
                )}
              </div>
            </Paper>
          </div>
          <div className="right-panel">
            {/* KPIs al frente de la gráfica */}
            <Paper className="kpi-card" elevation={1}>
              <div className="kpi-row">
                <div className="kpi-item">
                  <div className="kpi-title">Ingresos</div>
                  <div className="kpi-value">{numberFmt(resumen.ingresosTotal)}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">Egresos</div>
                  <div className="kpi-value">{numberFmt(resumen.egresosTotal)}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">Margen</div>
                  <div className="kpi-value">{numberFmt(resumen.margenTotal)}</div>
                </div>
              </div>
              <Divider sx={{ my: 1 }} />
              <div className="kpi-row">
                <div className="kpi-item">
                  <div className="kpi-title">B/C</div>
                  <div className="kpi-value">{(() => {
                    const bc = rentabilidadQuery.data?.beneficioCosto;
                    if (bc === null || bc === undefined) return 'N/A';
                    return Number(bc).toFixed(2);
                  })()}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">% Margen</div>
                  <div className="kpi-value">{(() => {
                    const pm = rentabilidadQuery.data?.margenPorcentaje;
                    if (pm === null || pm === undefined) return 'N/A';
                    return `${Number(pm).toFixed(2)}%`;
                  })()}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">Rentable</div>
                  <div className="kpi-value">{rentabilidadQuery.data?.rentable === true ? 'Sí' : rentabilidadQuery.data?.rentable === false ? 'No' : 'N/A'}</div>
                </div>
              </div>
            </Paper>

            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Gasto por categoría (pie)</Typography>
              <Divider sx={{ my: 1 }} />
              <div className="pie-list">
                {topCategorias.map((c) => (
                  <div key={c.nombre} className="pie-item">
                    <Chip size="small" label={c.nombre} />
                    <span className="pie-value">{numberFmt(c.total)}</span>
                  </div>
                ))}
                {topCategorias.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sin categorías</Typography>
                )}
              </div>
            </Paper>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="content-grid">
          <div className="left-panel">
            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Ranking por cultivo</Typography>
              <Divider sx={{ my: 1 }} />
              <div className="chart-container">
                {margenListaQuery.isLoading ? (
                  <div className="chart-placeholder">Cargando ranking...</div>
                ) : margenListaQuery.isError ? (
                  <div className="chart-placeholder">Error cargando ranking</div>
                ) : rankingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={rankingData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="nombre" width={120} />
                      <Tooltip />
                      <Bar dataKey="margen" name="Margen" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para ranking</div>
                )}
              </div>
            </Paper>
          </div>
          <div className="right-panel">
            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Tabla resumen cultivos</Typography>
              <Divider sx={{ my: 1 }} />
              {margenListaQuery.isLoading ? (
                <Typography variant="body2" color="text.secondary">Cargando...</Typography>
              ) : rankingData.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cultivo</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                      <TableCell align="right">Egresos</TableCell>
                      <TableCell align="right">Margen</TableCell>
                      <TableCell align="right">B/C</TableCell>
                      <TableCell align="right">% Margen</TableCell>
                      <TableCell>Rentable</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {margenRows.slice(0, 10).map((r) => {
                      const ingresos = parseFloat(r.ingresos || 0);
                      const egresos = parseFloat(r.egresos || 0);
                      const margen = parseFloat(r.margen || (ingresos - egresos));
                      const bc = egresos > 0 ? ingresos / egresos : null;
                      const pm = ingresos > 0 ? (margen / ingresos) * 100 : null;
                      const rentable = bc !== null ? bc > (parseFloat(umbral) || 1) : margen > 0;
                      const nombre = r.nombre_cultivo || r.cultivo || r.nombre;
                      return (
                        <TableRow key={nombre}>
                          <TableCell>{nombre}</TableCell>
                          <TableCell align="right">{numberFmt(ingresos)}</TableCell>
                          <TableCell align="right">{numberFmt(egresos)}</TableCell>
                          <TableCell align="right">{numberFmt(margen)}</TableCell>
                          <TableCell align="right">{bc === null ? 'N/A' : Number(bc).toFixed(2)}</TableCell>
                          <TableCell align="right">{pm === null ? 'N/A' : `${Number(pm).toFixed(2)}%`}</TableCell>
                          <TableCell>{rentable ? 'Sí' : 'No'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin datos</Typography>
              )}
            </Paper>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="content-grid">
          <div className="left-panel">
            <Paper className="export-card" elevation={1}>
              <Typography variant="subtitle1">Exportaciones</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" sx={{
                  backgroundColor: 'var(--primary-green)',
                  color: '#fff',
                  '&:hover': { backgroundColor: 'var(--primary-green)' }
                }} disabled={!cultivoId} onClick={() => handleExport('excel')}>Exportar Excel</Button>
                <Button size="small" variant="contained" color="primary" disabled={!cultivoId} onClick={() => handleExport('pdf')}>Exportar PDF</Button>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Vista previa (primeras 4 filas)
              </Typography>
              {chartData.length > 0 ? (
                <Table size="small" aria-label="preview-export">
                  <TableHead>
                    <TableRow>
                      <TableCell>Periodo</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                      <TableCell align="right">Egresos</TableCell>
                      <TableCell align="right">Margen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chartData.slice(0, 5).map((row) => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{numberFmt(row.ingresos)}</TableCell>
                        <TableCell align="right">{numberFmt(row.egresos)}</TableCell>
                        <TableCell align="right">{numberFmt(row.margen)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin datos para exportar</Typography>
              )}
            </Paper>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;