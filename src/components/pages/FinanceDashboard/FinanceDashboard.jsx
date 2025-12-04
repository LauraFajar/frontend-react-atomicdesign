import React, { useMemo, useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Divider, Chip, Alert, Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, FormControlLabel, Switch } from '@mui/material';
import dayjs from 'dayjs';
import financeService from '../../../services/financeService';
import cropService from '../../../services/cropService';
import movimientosService from '../../../services/movimientosService';
import activityService from '../../../services/activityService';
import './FinanceDashboard.css';
import { useAuth } from '../../../contexts/AuthContext';
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
  Cell,
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
  const [rankOnlySelected, setRankOnlySelected] = useState(true);
  const [costoHora, setCostoHora] = useState(0);
  const [horasPorTipo, setHorasPorTipo] = useState({});
  const [depreciacionMensual, setDepreciacionMensual] = useState(0);
  const [vidaUtilMeses, setVidaUtilMeses] = useState(24);

  const { hasAnyPermission } = useAuth();
  const canExport = hasAnyPermission(['finanzas:*','finanzas:exportar']);
  const canCreateIngreso = hasAnyPermission(['ingresos:*','ingresos:crear']);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      console.debug('[FinanceDashboard] permissions check', { canExport });
    } catch (e) {
      console.warn('[FinanceDashboard] debug log failed', e)
    }
  }, [canExport]);

  const { data: cropsData = { items: [] } } = useQuery({
    queryKey: ['crops', 1, 100],
    queryFn: () => cropService.getCrops(1, 100),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!cultivoId) return;
    try {
      const key = `financeParams:${cultivoId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.costoHora != null) setCostoHora(parsed.costoHora);
        if (parsed.depreciacionMensual != null) setDepreciacionMensual(parsed.depreciacionMensual);
        if (parsed.vidaUtilMeses != null) setVidaUtilMeses(parsed.vidaUtilMeses);
        if (parsed.horasPorTipo && typeof parsed.horasPorTipo === 'object') setHorasPorTipo(parsed.horasPorTipo);
      }
    } catch (e) {
      console.warn('[FinanceDashboard] load params failed', e);
    }
  }, [cultivoId]);

  useEffect(() => {
    if (!cultivoId) return;
    try {
      const key = `financeParams:${cultivoId}`;
      const data = {
        costoHora: Number(costoHora || 0),
        depreciacionMensual: Number(depreciacionMensual || 0),
        vidaUtilMeses: Number(vidaUtilMeses || 0),
        horasPorTipo: Object.keys(horasPorTipo || {}).reduce((acc, k) => {
          acc[k] = Number(horasPorTipo[k] || 0);
          return acc;
        }, {})
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[FinanceDashboard] save params failed', e);
    }
  }, [cultivoId, costoHora, depreciacionMensual, vidaUtilMeses, horasPorTipo]);

  const resumenQuery = useQuery({
    queryKey: ['finanzasResumen', cultivoId, from, to, groupBy, tipo],
    queryFn: () => financeService.getResumen({ cultivoId, from, to, groupBy, tipo }),
    enabled: Boolean(cultivoId),
  });

  const rentabilidadQuery = useQuery({
    queryKey: ['finanzasRentabilidad', cultivoId, from, to, 'porcentaje', umbral],
    queryFn: () => financeService.getRentabilidad({ cultivoId, from, to, criterio: 'porcentaje', umbral }),
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
    const rows = rankOnlySelected && cultivoId
      ? margenRows.filter((r) => String(r.id_cultivo ?? r.id) === String(cultivoId))
      : margenRows;
    const mapped = rows.map((r) => {
      const ingresos = parseFloat(r.ingresos || 0);
      const egresos = parseFloat(r.egresos || 0);
      const margen = parseFloat(r.margen || (ingresos - egresos));
      const bc = egresos > 0 ? ingresos / egresos : null;
      const pm = ingresos > 0 ? (margen / ingresos) * 100 : 0;
      const rentable = bc !== null ? bc > 1 : margen > 0;
      return { nombre: r.nombre_cultivo || r.cultivo || r.nombre, margen, bc, pm, rentable };
    });
    return mapped.sort((a, b) => (b.pm || 0) - (a.pm || 0));
  }, [margenRows, umbral, rankOnlySelected, cultivoId]);

  const ingresosQuery = useQuery({
    queryKey: ['finanzasIngresos', cultivoId, from, to],
    queryFn: () => financeService.getIngresos({ cultivoId, from, to }),
    enabled: Boolean(cultivoId),
  });

  const salidasQuery = useQuery({
    queryKey: ['finanzasSalidas', cultivoId, from, to],
    queryFn: () => financeService.getSalidas({ cultivoId, from, to }),
    enabled: Boolean(cultivoId),
  });

  const actividadesQuery = useQuery({
    queryKey: ['finanzasActividades', cultivoId, from, to],
    queryFn: () => activityService.getActivityReport({ id_cultivo: cultivoId, fecha_inicio: from, fecha_fin: to }),
    enabled: Boolean(cultivoId),
  });

  const actividadesFallbackQuery = useQuery({
    queryKey: ['finanzasActividadesFallback', cultivoId],
    queryFn: () => activityService.getActivities({ id_cultivo: cultivoId }, 1, 1000),
    enabled: Boolean(cultivoId),
  });

  const [ingresoFecha, setIngresoFecha] = useState(dayjs().format('YYYY-MM-DD'));
  const [ingresoMonto, setIngresoMonto] = useState('');
  const [ingresoDescripcion, setIngresoDescripcion] = useState('');

  const createIngresoMutation = useMutation({
    mutationFn: (payload) => financeService.createIngreso(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['finanzasResumen'] }),
        queryClient.invalidateQueries({ queryKey: ['finanzasIngresos'] }),
        queryClient.invalidateQueries({ queryKey: ['finanzasMargenLista'] }),
      ]);
      setIngresoMonto('');
      setIngresoDescripcion('');
    },
  });

  const movimientosQuery = useQuery({
    queryKey: ['movimientosHerramientas'],
    queryFn: () => movimientosService.getMovimientos({}, 1, 200),
  });

  const actividadesItems = useMemo(() => {
    const d = actividadesQuery.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.items)) return d.items;
    if (Array.isArray(d?.data)) return d.data;
    const f = actividadesFallbackQuery.data;
    if (Array.isArray(f?.items)) return f.items;
    if (Array.isArray(f)) return f;
    if (Array.isArray(f?.data)) return f.data;
    return [];
  }, [actividadesQuery.data, actividadesFallbackQuery.data]);

  const [recursosPorActividad, setRecursosPorActividad] = useState({});
  useEffect(() => {
    const ids = actividadesItems.slice(0, 50).map(a => a.id).filter(Boolean);
    let cancelled = false;
    (async () => {
      const promises = ids.map(async (id) => {
        if (recursosPorActividad[id]) return;
        try {
          const recursos = await activityService.getRecursosByActividad(id);
          if (!cancelled) {
            setRecursosPorActividad(prev => ({ ...prev, [id]: recursos }));
          }
        } catch (e) { console.error('Error cargando recursos de actividad', e); }
      });
      await Promise.all(promises);
    })();
    return () => { cancelled = true; };
  }, [actividadesItems]);

  const tiposActividad = useMemo(() => {
    const set = new Set();
    actividadesItems.forEach(a => set.add(String(a.tipo_actividad || '').toLowerCase()));
    return Array.from(set).filter(Boolean);
  }, [actividadesItems]);

  useEffect(() => {
    if (tiposActividad.length > 0) {
      setHorasPorTipo(prev => {
        const next = { ...prev };
        tiposActividad.forEach(t => { if (next[t] == null) next[t] = 1; });
        return next;
      });
    }
  }, [tiposActividad]);

  const actividadesPorTipo = useMemo(() => {
    const acc = {};
    tiposActividad.forEach(t => acc[t] = 0);
    actividadesItems.forEach(a => {
      const t = String(a.tipo_actividad || '').toLowerCase();
      if (!acc[t]) acc[t] = 0;
      acc[t] += 1;
    });
    return acc;
  }, [actividadesItems, tiposActividad]);

  const manoObraTotal = useMemo(() => {
    return actividadesItems.reduce((sum, a) => sum + (parseFloat(a.costo_mano_obra || '0') || 0), 0);
  }, [actividadesItems]);

  const egresosTotal = useMemo(() => {
    const d = resumenQuery.data || {};
    const v = parseFloat(d.egresosTotal ?? d.egresos ?? 0) || 0;
    return v;
  }, [resumenQuery.data]);

  const monthsInPeriod = useMemo(() => {
    const start = dayjs(from);
    const end = dayjs(to);
    const diffDays = Math.max(0, end.diff(start, 'day'));
    const m = Math.max(1, Math.round(diffDays / 30));
    return m;
  }, [from, to]);

  const depreciacionTotal = useMemo(() => {
    return actividadesItems.reduce((sum, a) => sum + (parseFloat(a.costo_maquinaria || '0') || 0), 0);
  }, [actividadesItems]);

  const costoProduccionTotal = useMemo(() => {
    return Number(egresosTotal || 0);
  }, [egresosTotal]);

  const herramientasMovs = useMemo(() => {
    const list = Array.isArray(movimientosQuery.data?.items) ? movimientosQuery.data.items : [];
    return list.filter(m => {
      const cat = String(m.insumo_categoria || '').toLowerCase();
      const isEntrada = String(m.tipo_movimiento || '').toLowerCase() === 'entrada';
      return isEntrada && /(herramienta|equipo|maquinaria)/.test(cat);
    });
  }, [movimientosQuery.data]);

  const herramientasVida = useMemo(() => {
    const vidaMeses = Number(vidaUtilMeses || 0);
    return herramientasMovs.map(m => {
      const fecha = dayjs(m.fecha_movimiento);
      const edadMeses = dayjs().diff(fecha, 'month');
      const restante = Math.max(0, vidaMeses - edadMeses);
      return { nombre: m.raw?.insumo?.nombre_insumo || String(m.id_insumo), fecha_movimiento: m.fecha_movimiento, edadMeses, restanteMeses: restante };
    });
  }, [herramientasMovs, vidaUtilMeses]);

  const handleExport = async (type) => {
    if (!cultivoId) return;
    try {
      const selected = cropItemsNormalized.find((c) => String(c.id) === String(cultivoId));
      const nombreCultivo = selected?.nombre || String(cultivoId);
      const safeName = nombreCultivo
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '');

      if (type === 'excel') {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Reporte');
        const currencyFmt = '"$" #,##0';

        ws.getCell('A1').value = `Control Financiero - ${nombreCultivo}`;
        ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF2E7D32' } };
        ws.getCell('A2').value = `Rango: ${from} a ${to} | Grupo: ${groupBy}`;
        ws.getCell('A2').font = { color: { argb: 'FF666666' } };

        const kpiStartRow = 4;
        ws.getRow(kpiStartRow).values = ['Indicador', 'Valor'];
        ws.getRow(kpiStartRow).font = { bold: true, color: { argb: 'FF2E7D32' } };
        const kpiRows = [
          ['Ingresos', Number(resumen?.ingresosTotal ?? 0)],
          ['Egresos', Number(resumen?.egresosTotal ?? 0)],
          ['Margen', Number(resumen?.margenTotal ?? 0)],
          ['B/C', rentabilidadQuery.data?.beneficioCosto ?? null],
          ['% Margen', rentabilidadQuery.data?.margenPorcentaje ?? null],
          ['Rentable', rentabilidadQuery.data?.rentable === true ? 'Sí' : rentabilidadQuery.data?.rentable === false ? 'No' : 'N/A'],
        ];
        for (let i = 0; i < kpiRows.length; i++) {
          const rIdx = kpiStartRow + 1 + i;
          const [label, val] = kpiRows[i];
          ws.getRow(rIdx).values = [label, label === '% Margen' && typeof val === 'number' ? Number(val) / 100 : val];
          if (label === 'Ingresos' || label === 'Egresos' || label === 'Margen') ws.getCell(`B${rIdx}`).numFmt = currencyFmt;
          if (label === '% Margen' && typeof val === 'number') ws.getCell(`B${rIdx}`).numFmt = '0.00%';
        }
        ws.getColumn(1).width = 18;
        ws.getColumn(2).width = 18;

        const tableStart = kpiStartRow + kpiRows.length + 3;
        ws.getRow(tableStart).values = ['Periodo', 'Ingresos', 'Egresos', 'Margen'];
        ws.getRow(tableStart).font = { bold: true, color: { argb: 'FF2E7D32' } };
        ws.getRow(tableStart).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        ws.getColumn(1).width = 14;
        ws.getColumn(2).width = 16;
        ws.getColumn(3).width = 16;
        ws.getColumn(4).width = 16;

        const dataRows = chartData.map((r) => ({
          Periodo: r.name,
          Ingresos: Number(r.ingresos ?? 0),
          Egresos: Number(r.egresos ?? 0),
          Margen: Number(r.margen ?? 0),
        }));
        for (let i = 0; i < dataRows.length; i++) {
          const idx = tableStart + 1 + i;
          const row = dataRows[i];
          ws.getRow(idx).values = [row.Periodo, row.Ingresos, row.Egresos, row.Margen];
          ws.getCell(`B${idx}`).numFmt = currencyFmt;
          ws.getCell(`C${idx}`).numFmt = currencyFmt;
          ws.getCell(`D${idx}`).numFmt = currencyFmt;
        }
        // Separadores de filas
        const lastRow = tableStart + dataRows.length;
        for (let r = tableStart; r <= lastRow; r++) {
          ['A','B','C','D'].forEach((c) => {
            ws.getCell(`${c}${r}`).border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
          });
        }

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${safeName}_${from}_${to}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const html = buildReportHtml(nombreCultivo);
        const w = window.open('', '_blank');
        if (!w) throw new Error('No se pudo abrir ventana para PDF');
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => {
          try {
            w.print();
            w.close();
          } catch (err) {
            console.warn('No se pudo imprimir/cerrar la ventana del reporte:', err);
          }
        }, 300);
      }
    } catch (e) {
      console.error('Error exportando reporte:', e);
      alert('No fue posible exportar el reporte');
    }
  };

  const buildReportHtml = (nombreCultivo) => {
    const fechaRango = `${from} a ${to}`;
    const kpiBc = rentabilidadQuery.data?.beneficioCosto;
    const kpiPm = rentabilidadQuery.data?.margenPorcentaje;
    const kpiRent = rentabilidadQuery.data?.rentable;
    const rows = chartData.slice(0, 100);
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; }
        .report { padding: 16px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
        .title { color: #2e7d32; font-size: 20px; font-weight: 700; margin:0; }
        .subtitle { color: #666; margin: 4px 0 0 0; }
        .kpis { display:flex; gap:12px; margin: 12px 0; }
        .kpi { border:1px solid #e5e7eb; border-radius:8px; padding:8px 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background:#f3f4f6; color:#2e7d32; text-align:left; padding:8px; border-bottom:2px solid #e5e7eb; }
        td { padding:8px; border-bottom:1px solid #eee; }
        tr:nth-child(even) td { background: #fafafa; }
      </style>
    `;
    const kpisHtml = `
      <div class="kpis">
        <div class="kpi">Ingresos: ${numberFmt(resumen.ingresosTotal)}</div>
        <div class="kpi">Egresos: ${numberFmt(resumen.egresosTotal)}</div>
        <div class="kpi">Margen: ${numberFmt(resumen.margenTotal)}</div>
        <div class="kpi">B/C: ${kpiBc === null || kpiBc === undefined ? 'N/A' : Number(kpiBc).toFixed(2)}</div>
        <div class="kpi">% Margen: ${kpiPm === null || kpiPm === undefined ? 'N/A' : `${Number(kpiPm).toFixed(2)}%`}</div>
        <div class="kpi">Rentable: ${kpiRent === true ? 'Sí' : kpiRent === false ? 'No' : 'N/A'}</div>
      </div>
    `;
    const tableRows = rows.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${numberFmt(r.ingresos)}</td>
        <td>${numberFmt(r.egresos)}</td>
        <td>${numberFmt(r.margen)}</td>
      </tr>
    `).join('');
    const html = `
      <html>
      <head>${style}</head>
      <body>
        <div class="report">
          <div class="header">
            <div>
              <h1 class="title">Control Financiero - ${nombreCultivo}</h1>
              <p class="subtitle">Rango: ${fechaRango} | Grupo: ${groupBy}</p>
            </div>
          </div>
          ${kpisHtml}
          <table>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    return html;
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
          <TextField size="small" label="Umbral margen %" type="number" value={umbral} onChange={(e) => setUmbral(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
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

      {canCreateIngreso && cultivoId && (
        <Paper className="filters-card" elevation={1}>
          <Box className="filters-row">
            <TextField size="small" type="date" label="Fecha ingreso" value={ingresoFecha} onChange={(e)=>setIngresoFecha(e.target.value)} InputLabelProps={{ shrink:true }} className="filter-item" />
            <TextField size="small" type="number" label="Monto" value={ingresoMonto} onChange={(e)=>setIngresoMonto(e.target.value)} inputProps={{ min:0 }} className="filter-item" />
            <TextField size="small" label="Descripción" value={ingresoDescripcion} onChange={(e)=>setIngresoDescripcion(e.target.value)} className="filter-item" />
            <Button variant="contained" sx={{ backgroundColor: 'var(--primary-green)', color: '#fff', '&:hover': { backgroundColor: 'var(--primary-green)' } }} disabled={!ingresoFecha || !ingresoMonto} onClick={() => createIngresoMutation.mutate({ cultivoId, fecha: ingresoFecha, monto: ingresoMonto, descripcion: ingresoDescripcion })}>Registrar ingreso</Button>
          </Box>
        </Paper>
      )}

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
          <Tab label="Costo" disableRipple sx={{ color: 'var(--primary-green)', '&.Mui-selected': { color: 'var(--primary-green)', fontWeight: 600 } }} />
          <Tab label="Historial" disableRipple sx={{ color: 'var(--primary-green)', '&.Mui-selected': { color: 'var(--primary-green)', fontWeight: 600 } }} />
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
                  <div className="kpi-value">{(() => {
                    const bc = rentabilidadQuery.data?.beneficioCosto;
                    if (bc === null || bc === undefined) return 'N/A';
                    return Number(bc) > 1 ? 'Sí' : 'No';
                  })()}</div>
                </div>
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
                      <Bar dataKey="pm" name="% Margen">
                        {rankingData.map((entry, index) => {
                          const c = entry.bc != null && entry.bc > 1
                            ? (entry.pm >= Number(umbral) ? '#2e7d32' : '#ed6c02')
                            : '#d32f2f';
                          return <Cell key={`cell-${index}`} fill={c} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para ranking</div>
                )}
              </div>
            </Paper>

            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Gastos por cultivo</Typography>
              <Divider sx={{ my: 1 }} />
              <div className="chart-container">
                {margenRows.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={[...(rankOnlySelected && cultivoId
                        ? margenRows.filter((r) => String(r.id_cultivo ?? r.id) === String(cultivoId))
                        : margenRows)]
                        .map((r) => ({ nombre: r.nombre_cultivo || r.cultivo || r.nombre, egresos: parseFloat(r.egresos || 0) }))
                        .sort((a, b) => b.egresos - a.egresos)
                        .slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="nombre" width={120} />
                      <Tooltip />
                      <Bar dataKey="egresos" name="Egresos" fill="#d32f2f" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos de gastos</div>
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
                    {(rankOnlySelected && cultivoId ? margenRows.filter((r) => String(r.id_cultivo ?? r.id) === String(cultivoId)) : margenRows).slice(0, 10).map((r) => {
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
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={<Switch checked={rankOnlySelected} onChange={(e) => setRankOnlySelected(e.target.checked)} />}
                label="Sólo cultivo seleccionado"
              />
            </Box>
          </div>
        </div>
      )}

      {tab === 4 && (
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
                }} disabled={!cultivoId || !canExport} onClick={() => handleExport('excel')}>Exportar Excel</Button>
                <Button size="small" variant="contained" color="primary" disabled={!cultivoId || !canExport} onClick={() => handleExport('pdf')}>Exportar PDF</Button>
                
              </Box>
              {!canExport && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  No tienes permiso para exportar datos financieros.
                </Typography>
              )}
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

      {tab === 2 && (
        <div className="content-grid">
          <div className="left-panel">
            <Paper className="kpi-card" elevation={1}>
              <div className="kpi-row">
                <div className="kpi-item">
                  <div className="kpi-title">Egresos</div>
                  <div className="kpi-value">{numberFmt(egresosTotal)}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">Mano de obra (registrada)</div>
                  <div className="kpi-value">{numberFmt(manoObraTotal)}</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-title">Maquinaria (registrada)</div>
                  <div className="kpi-value">{numberFmt(depreciacionTotal)}</div>
                </div>
              </div>
              <Divider sx={{ my: 1 }} />
              <div className="kpi-row">
                <div className="kpi-item">
                  <div className="kpi-title">Costo de producción</div>
                  <div className="kpi-value">{numberFmt(costoProduccionTotal)}</div>
                </div>
              </div>
            </Paper>

            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Parámetros</Typography>
              <Divider sx={{ my: 1 }} />
              <Box className="filters-row">
                <TextField size="small" label="Costo hora" type="number" value={costoHora} onChange={(e) => setCostoHora(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Depreciación mensual" type="number" value={depreciacionMensual} onChange={(e) => setDepreciacionMensual(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Vida útil herramientas (meses)" type="number" value={vidaUtilMeses} onChange={(e) => setVidaUtilMeses(e.target.value)} className="filter-item" InputLabelProps={{ shrink: true }} />
              </Box>
            </Paper>

            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Mano de obra por tipo</Typography>
              <Divider sx={{ my: 1 }} />
              {tiposActividad.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Actividades</TableCell>
                      <TableCell align="right">Horas por actividad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tiposActividad.map((t) => (
                      <TableRow key={t}>
                        <TableCell>{t}</TableCell>
                        <TableCell align="right">{Number(actividadesPorTipo[t] || 0)}</TableCell>
                        <TableCell align="right">
                          <TextField size="small" type="number" value={horasPorTipo[t] || 0} onChange={(e) => setHorasPorTipo({ ...horasPorTipo, [t]: e.target.value })} sx={{ width: 100 }} />
                        </TableCell>
                        <TableCell align="right">{numberFmt(Number(actividadesPorTipo[t] || 0) * Number(horasPorTipo[t] || 0) * Number(costoHora || 0))}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Total</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell align="right">{numberFmt(manoObraTotal)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin actividades en el rango</Typography>
              )}
            </Paper>
          </div>
          <div className="right-panel">
            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Distribución por categoría</Typography>
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
            <Paper className="chart-card" elevation={1} sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Vida útil herramientas</Typography>
              <Divider sx={{ my: 1 }} />
              {herramientasVida.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Herramienta</TableCell>
                      <TableCell>Entrada</TableCell>
                      <TableCell align="right">Edad (meses)</TableCell>
                      <TableCell align="right">Restante (meses)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {herramientasVida.slice(0, 10).map(h => (
                      <TableRow key={`${h.nombre}-${h.fecha_movimiento}`}>
                        <TableCell>{h.nombre}</TableCell>
                        <TableCell>{h.fecha_movimiento || '-'}</TableCell>
                        <TableCell align="right">{h.edadMeses}</TableCell>
                        <TableCell align="right">{h.restanteMeses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin herramientas registradas</Typography>
              )}
            </Paper>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div className="content-grid">
          <div className="left-panel">
            <Paper className="chart-card" elevation={1}>
              <Typography variant="subtitle1">Historial de actividades</Typography>
              <Divider sx={{ my: 1 }} />
              {actividadesItems.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Responsable</TableCell>
                      <TableCell>Detalles</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividadesItems.slice(0, 20).map(a => (
                      <TableRow key={a.id}>
                        <TableCell>{a.fecha || '-'}</TableCell>
                        <TableCell>{a.tipo_actividad || '-'}</TableCell>
                        <TableCell>{a.responsable || '-'}</TableCell>
                        <TableCell>{a.detalles || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin actividades</Typography>
              )}
            </Paper>

            <Paper className="chart-card" elevation={1} sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Costos por actividad</Typography>
              <Divider sx={{ my: 1 }} />
              {actividadesItems.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo de Actividad</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Costo Mano de Obra</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Recursos Consumibles</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividadesItems.slice(0, 20).map((act) => (
                      <TableRow key={act.id}>
                        <TableCell>{act.tipo_actividad}</TableCell>
                        <TableCell>{act.fecha}</TableCell>
                        <TableCell>{act.costo_mano_obra ?? '-'}</TableCell>
                        <TableCell>
                          {((recursosPorActividad[act.id] || [])
                            .filter(r => r.horas_uso == null)
                            .reduce((sum, r) => sum + (Number(r.cantidad || 0)), 0))}
                        </TableCell>
                        <TableCell>
                          {(recursosPorActividad[act.id] || [])
                            .filter(r => r.horas_uso == null)
                            .map((r, idx) => (
                              <div key={idx}>
                                {r.nombre_insumo}: Cantidad {r.cantidad ?? '-'} | Costo U {r.costo_unitario ?? '-'}
                              </div>
                            ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin costos</Typography>
              )}
            </Paper>
          </div>
          <div className="right-panel">
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
            </Paper>
            <Paper className="chart-card" elevation={1} sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Herramientas usadas</Typography>
              <Divider sx={{ my: 1 }} />
              {actividadesItems.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo de Actividad</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Costo Mano de Obra</TableCell>
                      <TableCell>Costo Maquinaria</TableCell>
                      <TableCell>Herramientas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividadesItems.slice(0, 20).map((act) => (
                      <TableRow key={act.id}>
                        <TableCell>{act.tipo_actividad}</TableCell>
                        <TableCell>{act.fecha}</TableCell>
                        <TableCell>{act.costo_mano_obra ?? '-'}</TableCell>
                        <TableCell>{act.costo_maquinaria ?? '-'}</TableCell>
                        <TableCell>
                          {(recursosPorActividad[act.id] || [])
                            .filter(r => r.horas_uso != null)
                            .map((r, idx) => (
                              <div key={idx}>{r.nombre_insumo}: {`${r.horas_uso} h`}</div>
                            ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin herramientas</Typography>
              )}
            </Paper>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
