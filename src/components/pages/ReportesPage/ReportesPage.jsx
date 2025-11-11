import React, { useEffect, useState } from 'react';
import inventoryService from '../../../services/inventoryService';
import movimientosService from '../../../services/movimientosService';
import categoriasService from '../../../services/categoriasService';
import almacenesService from '../../../services/almacenesService';
import './ReportesPage.css';
import * as XLSX from 'xlsx';

const ReportesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resumen, setResumen] = useState({
    totalItems: 0,
    stockTotal: 0,
    bajoStock: 0,
  });

  const [items, setItems] = useState([]);
  const [bajos, setBajos] = useState([]);
  const [movs, setMovs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [categoriaSel, setCategoriaSel] = useState('');
  const [almacenSel, setAlmacenSel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // filtro de tipo de movimiento eliminado
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lowThreshold, setLowThreshold] = useState(5);
  const [presetSel, setPresetSel] = useState('');
  // presets personalizados eliminados

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [itemsResp, lowResp, movsResp, catResp, almResp] = await Promise.all([
          inventoryService.getItems(1, 100),
          inventoryService.getLowStock(5),
          movimientosService.getMovimientos({}, 1, 5),
          categoriasService.getCategorias(1, 100),
          almacenesService.getAlmacenes(1, 100),
        ]);

        const itemsList = itemsResp?.items || [];
        const lowItems = lowResp?.items || [];
        const movItems = movsResp?.items || [];

        const totalItems = itemsList.length;
        const stockTotal = itemsList.reduce((sum, it) => sum + Number(it.cantidad || 0), 0);
        const bajoStock = lowItems.length;

        if (!mounted) return;
        setResumen({ totalItems, stockTotal, bajoStock });
        setItems(itemsList);
        setBajos(lowItems);
        setMovs(movItems);
        setCategorias(catResp?.items || []);
        setAlmacenes(almResp?.items || []);
      } catch (e) {
        console.error('[ReportesPage] Error cargando reportes de inventario:', e);
        if (mounted) setError('No se pudieron cargar los reportes de inventario');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // (sin carga automática de presets desde localStorage)

  const normalizeStr = (s) => String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const includesSearch = (name) => {
    const q = normalizeStr(searchTerm);
    if (!q) return true;
    return normalizeStr(name).includes(q);
  };
  const searchInsumosByNombre = (list, term) => {
    const q = normalizeStr(term);
    if (!q) return list;
    return list.filter((it) => normalizeStr(it.nombre).includes(q));
  };
  const parseDateSafe = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const inRange = (dateStr) => {
    const d = parseDateSafe(dateStr);
    if (!d) return true;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (from && d < from) return false;
    if (to) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59, 999);
      if (d > toEnd) return false;
    }
    return true;
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoStr = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const PRESETS = [
    { id: 'todo', name: 'Todo inventario y movimientos', apply: () => { setCategoriaSel(''); setAlmacenSel(''); setDateFrom(''); setDateTo(''); setSearchTerm(''); setLowThreshold(5); } },
    { id: 'stock-bajo-global', name: 'Stock bajo (global)', apply: () => { setCategoriaSel(''); setAlmacenSel(''); setDateFrom(''); setDateTo(''); setSearchTerm(''); setLowThreshold(5); } },
    { id: 'hoy', name: 'Hoy', apply: () => { setDateFrom(todayStr); setDateTo(todayStr); } },
    { id: 'ultima-semana', name: 'Últimos 7 días', apply: () => { setDateFrom(sevenDaysAgoStr); setDateTo(todayStr); } },
  ];

  const applyPreset = (id) => {
    const p = PRESETS.find((pr) => pr.id === id);
    if (p && typeof p.apply === 'function') {
      p.apply();
      setPresetSel(id);
    }
  };

  // función de guardado de presets eliminada (solo presets predefinidos)

  const resetFilters = () => {
    setCategoriaSel('');
    setAlmacenSel('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setLowThreshold(5);
    setPresetSel('');
  };

  const matchesFilters = (catName, almName) => {
    const catOk = !categoriaSel || (catName || '') === categoriaSel;
    const almOk = !almacenSel || (almName || '') === almacenSel;
    return catOk && almOk;
  };

  const filteredItems = searchInsumosByNombre(
    items.filter((it) => matchesFilters(it.categoria, it.almacen)),
    searchTerm
  );

  const lowByThreshold = items.filter((it) => Number(it.cantidad || 0) <= Number(lowThreshold || 0));
  const filteredBajos = searchInsumosByNombre(
    lowByThreshold.filter((it) => matchesFilters(it.categoria, it.almacen)),
    searchTerm
  );

  const filteredMovs = movs
    .filter((m) => matchesFilters(m.insumo_categoria, m.insumo_almacen))
    .filter((m) => inRange(m.fecha_movimiento))
    .filter((m) => {
      const nombre = items.find((i) => Number(i.insumoId ?? i.id_insumo) === Number(m.id_insumo))?.nombre || m?.raw?.insumo?.nombre_insumo || '';
      return includesSearch(nombre);
    });

  const resumenFiltrado = {
    totalItems: filteredItems.length,
    stockTotal: filteredItems.reduce((sum, it) => sum + Number(it.cantidad || 0), 0),
    bajoStock: filteredBajos.length,
  };

  const exportCSV = () => {
    const rows = [
      ['Insumo', 'Cantidad', 'Unidad', 'Categoría', 'Almacén'],
      ...filteredBajos.map(it => [
        it.nombre,
        Math.max(0, Number(it.cantidad || 0)),
        it.unidad || '',
        it.categoria || '',
        it.almacen || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')).join('\n');
    // Agregar BOM para que Excel muestre correctamente acentos y caracteres especiales
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateLabel = new Date().toISOString().slice(0, 10);
    a.download = `reportes_inventario_stock_bajo_${dateLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const data = [
      ['Insumo', 'Cantidad', 'Unidad', 'Categoría', 'Almacén'],
      ...filteredBajos.map(it => [
        it.nombre,
        Math.max(0, Number(it.cantidad || 0)),
        it.unidad || '',
        it.categoria || '',
        it.almacen || '',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Agregar auto filtro para que Excel permita filtrar por columnas
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: range.e.r, c: range.e.c } }) };
    // Anchos de columna para mejor lectura
    ws['!cols'] = [
      { wch: 30 }, // Insumo
      { wch: 12 }, // Cantidad
      { wch: 12 }, // Unidad
      { wch: 20 }, // Categoría
      { wch: 20 }, // Almacén
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock bajo');
    const dateLabel = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `reportes_inventario_stock_bajo_${dateLabel}.xlsx`);
  };

  const exportPDF = () => {
    // Preparar nombres y almacenes por id_insumo para imprimir movimientos
    const insumoNameById = new Map(items.map(i => [Number(i.insumoId ?? i.id_insumo), i.nombre]));
    const almacenByInsumoId = new Map(items.map(i => [Number(i.insumoId ?? i.id_insumo), i.almacen]));
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <style>
        @page { margin: 16mm; }
        body { font-family: Arial, sans-serif; padding: 0; }
        h2, h3 { margin: 0 0 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
        .filters { margin: 6px 0 12px; font-size: 12px; }
      </style>
      <h2>Reportes de Inventario</h2>
      <div class="filters">Filtros: 
        ${categoriaSel ? `Categoría: ${categoriaSel}; ` : ''}
        ${almacenSel ? `Almacén: ${almacenSel}; ` : ''}
        ${searchTerm ? `Búsqueda: ${searchTerm}; ` : ''}
        ${(dateFrom || dateTo) ? `Rango: ${dateFrom || '...'} a ${dateTo || '...'}; ` : ''}
        ${`Umbral stock bajo: ${lowThreshold}`}
      </div>
      <h3>Stock bajo</h3>
      <table>
        <thead><tr><th>Insumo</th><th>Cantidad</th><th>Unidad</th><th>Categoría</th><th>Almacén</th></tr></thead>
        <tbody>
          ${filteredBajos.map(it => `<tr>
            <td>${it.nombre}</td>
            <td>${Math.max(0, Number(it.cantidad || 0))}</td>
            <td>${it.unidad || ''}</td>
            <td>${it.categoria || ''}</td>
            <td>${it.almacen || ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <h3>Movimientos recientes</h3>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Insumo</th><th>Almacén</th><th>Cantidad</th><th>Unidad</th></tr></thead>
        <tbody>
          ${filteredMovs.length === 0
            ? `<tr><td colspan="6">Sin movimientos recientes</td></tr>`
            : filteredMovs.map(m => {
                const nombreInsumo = insumoNameById.get(Number(m.id_insumo)) || m?.raw?.insumo?.nombre_insumo || `Insumo ${m.id_insumo}`;
                const nombreAlmacen = m.insumo_almacen || almacenByInsumoId.get(Number(m.id_insumo)) || '';
                const fechaStr = m.fecha_movimiento || '-';
                const tipo = (m.tipo_movimiento || '').toLowerCase();
                const tipoPrint = tipo === 'entrada' ? 'Entrada' : (tipo === 'salida' ? 'Salida' : (m.tipo_movimiento || ''));
                return `<tr>
                  <td>${fechaStr}</td>
                  <td>${tipoPrint}</td>
                  <td>${nombreInsumo}</td>
                  <td>${nombreAlmacen}</td>
                  <td>${m.cantidad}</td>
                  <td>${m.unidad_medida}</td>
                </tr>`;
              }).join('')}
        </tbody>
      </table>
    `;

    const w = window.open('', 'PRINT', 'height=600,width=800');
    if (!w) return;
    w.document.write('<html><head><title>Reportes de Inventario</title></head><body>' + printContent.innerHTML + '</body></html>');
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="dashboard-content theme-green">
      <div className="report-header">
        <h2 className="report-title">Reportes de insumos</h2>
        <div className="export-actions">
          <button className="export-btn csv" onClick={exportXLSX}>Excel</button>
          <button className="export-btn pdf" onClick={exportPDF}>PDF</button>
        </div>
      </div>

      {error && (
        <div className="report-error">{error}</div>
      )}

      <div className="report-filters">
        <div className="filter-group">
          <label>tipo de Reporte</label>
          <select value={presetSel} onChange={(e) => applyPreset(e.target.value)}>
            <option value="">Selecciona...</option>
            {PRESETS.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <label>Categoría</label>
          <select value={categoriaSel} onChange={e => setCategoriaSel(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Almacén</label>
          <select value={almacenSel} onChange={e => setAlmacenSel(e.target.value)}>
            <option value="">Todos</option>
            {almacenes.map(a => (
              <option key={a.id} value={a.nombre}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Nombre insumo</label>
          <input type="text" placeholder="Nombre de insumo" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {/* filtro de tipo de movimiento eliminado */}
        <div className="filter-group">
          <label>Desde</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>insumos con stock bajo </label>
          <input type="number" min="0" step="1" value={lowThreshold} onChange={(e) => setLowThreshold(Number(e.target.value || 0))} />
        </div>
        <div className="export-actions" style={{ marginLeft: 'auto' }}>
          <button className="export-btn" onClick={resetFilters}>Limpiar</button>
        </div>
      </div>

    
      <div className="report-sections">
        <section className="report-section">
          <h3>Stock bajo</h3>
          {loading ? (
            <div className="report-loading">Cargando...</div>
          ) : (
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Categoría</th>
                    <th>Almacén</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBajos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="report-empty">Sin registros de stock bajo</td>
                    </tr>
                  ) : (
                    filteredBajos.map((it) => (
                      <tr key={`${it.id}-${it.insumoId}`}>
                        <td>{it.nombre}</td>
                        <td>{Math.max(0, Number(it.cantidad || 0))}</td>
                        <td>{it.unidad}</td>
                        <td>{it.categoria}</td>
                        <td>{it.almacen}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="report-section">
          <h3>Movimientos </h3>
          {loading ? (
            <div className="report-loading">Cargando...</div>
          ) : (
            <ul className="report-mov-list">
              {filteredMovs.length === 0 ? (
                <li className="report-empty">Sin movimientos recientes</li>
              ) : (
                filteredMovs.map((m) => {
                  const insumoNameById = new Map(items.map(i => [Number(i.insumoId ?? i.id_insumo), i.nombre]));
                  const almacenByInsumoId = new Map(items.map(i => [Number(i.insumoId ?? i.id_insumo), i.almacen]));
                  const nombreInsumo = insumoNameById.get(Number(m.id_insumo)) || m?.raw?.insumo?.nombre_insumo || `Insumo ${m.id_insumo}`;
                  const nombreAlmacen = m.insumo_almacen || almacenByInsumoId.get(Number(m.id_insumo)) || '';
                  const tipo = (m.tipo_movimiento || '').toLowerCase();
                  return (
                    <li key={m.id} className={`mov-${tipo}`}>
                      <span className="mov-date">{m.fecha_movimiento ?? '-'}</span>
                      <span className={`badge ${tipo === 'entrada' ? 'badge-entrada' : 'badge-salida'}`}>{m.tipo_movimiento}</span>
                      <span className="mov-insumo">{nombreInsumo}{nombreAlmacen ? ` · ${nombreAlmacen}` : ''}</span>
                      <span className="mov-qty">{m.cantidad} {m.unidad_medida}</span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReportesPage;