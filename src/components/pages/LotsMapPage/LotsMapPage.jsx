import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Typography, Paper, Box, CircularProgress, Fab, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Switch, List, ListItem, ListItemText, Divider, TextField } from '@mui/material';
import { AddLocationAlt, AddRoad, MyLocation, Edit } from '@mui/icons-material';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import lotService from '../../../services/lotService';
import sublotService from '../../../services/sublotService';
import cropService from '../../../services/cropService';
import LotFormModal from '../CropsPage/LotFormModal';
import SublotFormModal from '../SublotsPage/SublotFormModal';
import { useAlert } from '../../../contexts/AlertContext';
import './LotsMapPage.css';
import '../SublotsPage/SublotFormModal.css';

const swapCoords = (coords) => {
  if (!coords) return [];
  try {
    if (Array.isArray(coords[0])) {
      return coords.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
    }
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    return [];
  }
};

const FitToDataButton = ({ mapData }) => {
  const map = useMap();

  const collectAllLatLngs = () => {
    const all = [];
    mapData.forEach((lote) => {
      const lotePositions = swapCoords(lote.coordenadas?.coordinates);
      if (Array.isArray(lotePositions) && lotePositions.length) {
        if (Array.isArray(lotePositions[0])) {
          lotePositions.forEach((ring) => ring.forEach(([lat, lng]) => all.push([lat, lng])));
        } else {
          lotePositions.forEach(([lat, lng]) => all.push([lat, lng]));
        }
      }
      if (Array.isArray(lote.sublotes)) {
        lote.sublotes.forEach((sublote) => {
          const subPositions = swapCoords(sublote.coordenadas?.coordinates);
          if (Array.isArray(subPositions) && subPositions.length) {
            if (Array.isArray(subPositions[0])) {
              subPositions.forEach((ring) => ring.forEach(([lat, lng]) => all.push([lat, lng])));
            } else {
              subPositions.forEach(([lat, lng]) => all.push([lat, lng]));
            }
          }
        });
      }
    });
    return all;
  };

  const handleFit = () => {
    const coords = collectAllLatLngs();
    if (coords.length) {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  };

  return (
    <Fab className="map-fab" color="default" size="small" onClick={handleFit} aria-label="Centrar mapa">
      <MyLocation />
    </Fab>
  );
};

const DrawPolygonButton = ({ onSaved }) => {
  const alert = useAlert();
  const map = useMap();
  const [active, setActive] = useState(false);
  const [points, setPoints] = useState([]);
  const [polyLayer, setPolyLayer] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [lotId, setLotId] = useState('');
  const [lotName, setLotName] = useState('');

  const handleMapClick = (e) => {
    if (!active) return;
    const { lat, lng } = e.latlng;
    setPoints((prev) => [...prev, [lat, lng]]);
  };

  const toggleActive = () => {
    const next = !active;
    setActive(next);
    if (!next) {
      setPoints([]);
      if (polyLayer) {
        polyLayer.remove();
        setPolyLayer(null);
      }
    }
  };

  if (active && map && !map._ag_draw_listener) {
    map.on('click', handleMapClick);
    map._ag_draw_listener = true;
  }
  if (!active && map && map._ag_draw_listener) {
    map.off('click', handleMapClick);
    map._ag_draw_listener = false;
  }

  if (active && points.length >= 2) {
    const latlngs = points.map(([lat, lng]) => L.latLng(lat, lng));
    if (!polyLayer) {
      const layer = L.polygon(latlngs, { color: '#4CAF50' }).addTo(map);
      setPolyLayer(layer);
    } else {
      polyLayer.setLatLngs(latlngs);
    }
  }

  const handleSave = async () => {
    try {
      const ring = points.map(([lat, lng]) => [lng, lat]);
      const geometry = { type: 'Polygon', coordinates: [ring] };
      let targetId = lotId ? parseInt(lotId, 10) : null;
      if (!targetId) {
        const created = await lotService.createLot({ nombre_lote: lotName || 'Lote', descripcion: 'Geometría trazada', activo: true });
        targetId = created?.id || created?.id_lote;
      }
      await lotService.updateCoordinates(targetId, geometry);
      alert.success('Mapa', 'Coordenadas guardadas');
      setSaveOpen(false);
      toggleActive();
      if (onSaved) onSaved();
    } catch (e) {
      alert.error('Error', e?.response?.data?.message || e.message || 'No se pudieron guardar las coordenadas');
    }
  };

  return (
    <>
      <Fab className="map-fab draw" color={active ? 'success' : 'default'} size="small" onClick={() => active ? setSaveOpen(true) : toggleActive()} aria-label="Dibujar lote">
        <Edit />
      </Fab>
      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Guardar coordenadas</DialogTitle>
        <DialogContent dividers>
          <TextField label="ID de Lote (opcional)" value={lotId} onChange={(e) => setLotId(e.target.value)} fullWidth variant="outlined" className="modal-form-field" sx={{ mb: 2 }} />
          <TextField label="Nombre de Lote (si no hay ID)" value={lotName} onChange={(e) => setLotName(e.target.value)} fullWidth variant="outlined" className="modal-form-field" />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => { setSaveOpen(false); toggleActive(); }} variant="outlined" className="btn-cancel">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" className="btn-save">Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const LotsMapPage = () => {
  const alert = useAlert();
  const queryClient = useQueryClient();
  const [openLotModal, setOpenLotModal] = useState(false);
  const [openSublotModal, setOpenSublotModal] = useState(false);
  const [openLotsModal, setOpenLotsModal] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [showLots, setShowLots] = useState(true);
  const [showSublots, setShowSublots] = useState(true);
  const [selectedCropType, setSelectedCropType] = useState('perennes');

  const normalizeCropType = (t) => {
    if (!t) return null;
    const s = String(t).toLowerCase().trim();
    if (s.includes('peren')) return 'perennes';
    if (s.includes('transito')) return 'transitorios';
    if (s.includes('semi') && s.includes('peren')) return 'semiperennes';
    return s;
  };
  const CANONICAL_ORDER = ['perennes', 'transitorios', 'semiperennes'];

  const { data: mapData = [], isLoading: mapLoading, isError: mapError, error: mapErr } = useQuery({
    queryKey: ['lotesMapData'],
    queryFn: lotService.getMapData,
    staleTime: 60 * 1000,
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: lotService.getLots,
    staleTime: 60 * 1000,
  });
  const { data: sublots = [] } = useQuery({
    queryKey: ['sublots'],
    queryFn: sublotService.getSublots,
    staleTime: 60 * 1000,
  });

  const { data: cropsData = { items: [] } } = useQuery({
    queryKey: ['crops', 1, 100],
    queryFn: () => cropService.getCrops(1, 100),
    staleTime: 60 * 1000,
  });

  const stats = useMemo(() => ({
    lotsCount: Array.isArray(lots) ? lots.length : 0,
    sublotsCount: Array.isArray(sublots) ? sublots.length : 0,
  }), [lots, sublots]);

  const estadoResumen = useMemo(() => {
    const safeLots = Array.isArray(lots) ? lots : [];
    const safeSublots = Array.isArray(sublots) ? sublots : [];
    const safeMap = Array.isArray(mapData) ? mapData : [];

    const lotsActive = safeLots.filter((l) => l.activo === true).length;
    const lotsInactive = safeLots.filter((l) => l.activo === false).length;

    const lotsWithCoords = safeMap.filter((l) => {
      const coords = l?.coordenadas?.coordinates;
      return Array.isArray(coords) && coords.length > 0;
    }).length;
    const totalLots = safeLots.length;
    const lotsWithoutCoords = Math.max(totalLots - lotsWithCoords, 0);

    let sublotsWithCoords = 0;
    safeMap.forEach((l) => {
      if (Array.isArray(l.sublotes)) {
        l.sublotes.forEach((s) => {
          const coords = s?.coordenadas?.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            sublotsWithCoords += 1;
          }
        });
      }
    });
    const totalSublots = safeSublots.length;
    const sublotsWithoutCoords = Math.max(totalSublots - sublotsWithCoords, 0);

    return {
      lotsActive,
      lotsInactive,
      coordsWith: lotsWithCoords + sublotsWithCoords,
      coordsWithout: lotsWithoutCoords + sublotsWithoutCoords,
    };
  }, [lots, sublots, mapData]);

  const cropTypes = useMemo(() => {
    const items = Array.isArray(cropsData?.items) ? cropsData.items : (Array.isArray(cropsData) ? cropsData : []);
    const set = new Set(items.map((c) => normalizeCropType(c.tipo_cultivo)).filter(Boolean));
    const normalized = Array.from(set);
    const inOrder = CANONICAL_ORDER.filter((t) => set.has(t));
    const others = normalized.filter((t) => !CANONICAL_ORDER.includes(t)).sort();
    return [...inOrder, ...others];
  }, [cropsData]);

  const toRadians = (deg) => (deg * Math.PI) / 180;
  const polygonAreaMeters = (positions) => {
    try {
      const pts = Array.isArray(positions[0]) ? positions[0] : positions; 
      if (!Array.isArray(pts) || pts.length < 3) return 0;
      const R = 6371000;
      const lat0 = pts.reduce((sum, [lat]) => sum + toRadians(lat), 0) / pts.length;
      const cosLat0 = Math.cos(lat0);
      const xy = pts.map(([lat, lng]) => {
        const x = R * toRadians(lng) * cosLat0;
        const y = R * toRadians(lat);
        return [x, y];
      });
      let area = 0;
      for (let i = 0, j = xy.length - 1; i < xy.length; j = i++) {
        area += xy[j][0] * xy[i][1] - xy[i][0] * xy[j][1];
      }
      return Math.abs(area) / 2;
    } catch {
      return 0;
    }
  };

  const topByArea = useMemo(() => {
    const items = Array.isArray(mapData) ? mapData : [];
    const crops = Array.isArray(cropsData?.items) ? cropsData.items : (Array.isArray(cropsData) ? cropsData : []);
    const byLotIdCropTypes = new Map();
    crops.forEach((c) => {
      const types = byLotIdCropTypes.get(c.id_lote) || new Set();
      const norm = normalizeCropType(c.tipo_cultivo);
      if (norm) types.add(norm);
      byLotIdCropTypes.set(c.id_lote, types);
    });
    const rows = items.map((l) => {
      const positions = swapCoords(l.coordenadas?.coordinates);
      const area = polygonAreaMeters(positions);
      const types = Array.from(byLotIdCropTypes.get(l.id_lote) || []);
      return { id: l.id_lote, nombre: l.nombre_lote, area, tipos: types };
    });
    const filtered = selectedCropType ? rows.filter((r) => r.tipos.includes(selectedCropType)) : rows;
    return filtered.sort((a, b) => b.area - a.area).slice(0, 5);
  }, [mapData, cropsData, selectedCropType]);

  const createLotMutation = useMutation({
    mutationFn: (payload) => lotService.createLot({ ...payload, nombre_lote: payload.nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      queryClient.invalidateQueries(['lotesMapData']);
      setOpenLotModal(false);
      alert.success('Lotes', 'Lote creado correctamente');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el lote'),
  });

  const createSublotMutation = useMutation({
    mutationFn: (payload) => sublotService.createSublot(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sublots']);
      queryClient.invalidateQueries(['lotesMapData']);
      setOpenSublotModal(false);
      alert.success('Sublotes', 'Sublote creado correctamente');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo crear el sublote'),
  });

  const updateLotMutation = useMutation({
    mutationFn: ({ id, data }) => lotService.updateLot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      queryClient.invalidateQueries(['lotesMapData']);
      alert.success('Lotes', 'Estado del lote actualizado');
    },
    onError: (e) => alert.error('Error', e.message || 'No se pudo actualizar el estado del lote'),
  });

  const handleToggleLot = async (lot) => {
    try {
      setTogglingId(lot.id);
      await updateLotMutation.mutateAsync({ id: lot.id, data: { activo: !lot.activo } });
    } finally {
      setTogglingId(null);
    }
  };

  const lotOptions = { color: '#4CAF50', weight: 3 };
  const sublotOptions = { color: '#2196F3', weight: 2 };

  return (
    <div className="lots-map-page">
      <div className="page-header">
        <h1 className="page-title">Mapa de Lotes</h1>
        <div className="header-actions">
          <Button
            variant="contained"
            startIcon={<AddLocationAlt />}
            className="new-item-button"
            onClick={() => setOpenLotModal(true)}
          >
            Nuevo Lote
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoad />}
            className="new-item-button"
            onClick={() => setOpenSublotModal(true)}
          >
            Nuevo Sublote
          </Button>
          <Button
            variant="outlined"
            className="new-item-button"
            onClick={() => setOpenLotsModal(true)}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}
          >
            Ver Lotes
          </Button>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-panel">
          <Paper elevation={1} className="stats-card">
            <div className="stats-row">
              <div className="stats-item">
                <div className="stats-title">Lotes</div>
                <div className="stats-value">{stats.lotsCount}</div>
              </div>
              <div className="stats-item">
                <div className="stats-title">Sublotes</div>
                <div className="stats-value">{stats.sublotsCount}</div>
              </div>
            </div>
          </Paper>

          <Paper elevation={1} className="summary-card">
            <div className="summary-title">Resumen por estado</div>
            <div className="chips-row">
              <Chip label={`Activos: ${estadoResumen.lotsActive}`} color="success" variant="outlined" />
              <Chip label={`Inactivos: ${estadoResumen.lotsInactive}`} color="warning" variant="outlined" />
            </div>
            <div className="chips-row">
              <Chip label={`Con coordenadas: ${estadoResumen.coordsWith}`} color="primary" variant="outlined" />
              <Chip label={`Sin coordenadas: ${estadoResumen.coordsWithout}`} variant="outlined" />
            </div>
          </Paper>

          <Paper elevation={1} className="top-area-card">
            <div className="summary-title">Top por área</div>
            <div className="filter-chips">
              {cropTypes.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  clickable
                  color={selectedCropType === t ? 'primary' : 'default'}
                  onClick={() => setSelectedCropType(selectedCropType === t ? null : t)}
                  sx={selectedCropType === t ? { '& .MuiChip-label': { color: '#fff' } } : undefined}
                />
              ))}
              {cropTypes.length === 0 && (
                <Typography variant="body2" color="text.secondary">Sin tipos de cultivo</Typography>
              )}
            </div>
            <Divider sx={{ my: 1 }} />
            <div className="top-list">
              {topByArea.map((row) => (
                <div key={row.id} className="top-item">
                  <span className="top-name">{row.nombre || `Lote ${row.id}`}</span>
                  <span className="top-area">{(row.area / 10000).toFixed(2)} ha</span>
                </div>
              ))}
              {topByArea.length === 0 && (
                <Typography variant="body2" color="text.secondary">No hay datos para mostrar</Typography>
              )}
            </div>
          </Paper>

          <Dialog open={openLotsModal} onClose={() => setOpenLotsModal(false)} fullWidth maxWidth="sm">
            <DialogTitle>Listado de Lotes</DialogTitle>
            <DialogContent dividers>
              {Array.isArray(lots) && lots.length > 0 ? (
                <List>
                  {lots.map((l) => (
                    <ListItem key={l.id} disableGutters secondaryAction={
                      <Switch
                        edge="end"
                        checked={Boolean(l.activo)}
                        onChange={() => handleToggleLot(l)}
                        disabled={togglingId === l.id}
                        inputProps={{ 'aria-label': `switch-lote-${l.id}` }}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: 'success.main' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'success.main' }
                        }}
                      />
                    }>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{l.nombre}</Typography>
                            <Chip size="small" label={l.activo ? 'Activo' : 'Inactivo'} color={l.activo ? 'success' : 'default'} />
                          </Box>
                        }
                        secondary={l.descripcion || 'Sin descripción'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  {updateLotMutation.isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="body2">No hay lotes disponibles</Typography>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button color="success" variant="contained" onClick={() => setOpenLotsModal(false)}>Cerrar</Button>
            </DialogActions>
          </Dialog>

        </div>
        <div className="right-panel">
          <Paper elevation={2} className="map-wrapper">
            {mapLoading ? (
              <Box className="map-loading">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando mapa...</Typography>
              </Box>
            ) : mapError ? (
              <Typography color="error" sx={{ m: 2 }}>
                Error al cargar el mapa: {mapErr?.message}
              </Typography>
            ) : (
              <>
                <MapContainer center={[1.89, -76.09]} zoom={10} className="map-container">
                  <TileLayer
                    url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                  />
                  <DrawPolygonButton onSaved={() => queryClient.invalidateQueries(['lotesMapData'])} />
                  <FitToDataButton mapData={mapData} />
                  {mapData.map((lote) => {
                    const lotePositions = swapCoords(lote.coordenadas?.coordinates);
                    return (
                      <React.Fragment key={`lote-${lote.id_lote}`}>
                        {showLots && lotePositions.length > 0 && (
                          <Polygon pathOptions={lotOptions} positions={lotePositions}>
                            <Popup>
                              <b>Lote: {lote.nombre_lote}</b><br />
                              {lote.descripcion}
                              <br />
                              {(() => {
                                const lotMeta = (Array.isArray(lots) ? lots : []).find((l) => l.id === lote.id_lote);
                                const isActive = lotMeta?.activo === true;
                                return (
                                  <div style={{ marginTop: 8 }}>
                                    <span>Estado: {isActive ? 'Activo' : 'Inactivo'}</span>
                                    <br />
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={updateLotMutation.isLoading}
                                      onClick={() => updateLotMutation.mutate({ id: lote.id_lote, data: { activo: !isActive } })}
                                      sx={{ mt: 1 }}
                                    >
                                      {isActive ? 'Desactivar' : 'Activar'}
                                    </Button>
                                  </div>
                                );
                              })()}
                            </Popup>
                          </Polygon>
                        )}
                        {showSublots && Array.isArray(lote.sublotes) && lote.sublotes.map((sublote) => {
                          const subPositions = swapCoords(sublote.coordenadas?.coordinates);
                          return subPositions.length > 0 ? (
                            <Polygon key={`sublote-${sublote.id_sublote}`} pathOptions={sublotOptions} positions={subPositions}>
                              <Popup>
                                <b>Sublote: {sublote.descripcion}</b><br />
                                Ubicación: {sublote.ubicacion}<br />
                                Pertenece al lote: {lote.nombre_lote}
                              </Popup>
                            </Polygon>
                          ) : null;
                        })}
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </>
            )}
          </Paper>
          <div className="below-map-actions">
            <Button size="small" variant="contained" color="success" onClick={() => setShowLots((v) => !v)}>
              Lotes
            </Button>
            <Button size="small" variant="contained" color="info" onClick={() => setShowSublots((v) => !v)}>
              Sublotes
            </Button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <LotFormModal
        open={openLotModal}
        onClose={() => setOpenLotModal(false)}
        onSave={(data) => createLotMutation.mutate(data)}
        lot={null}
        isLoading={createLotMutation.isLoading}
        error={createLotMutation.error}
      />

      <SublotFormModal
        open={openSublotModal}
        onClose={() => setOpenSublotModal(false)}
        onSave={(data) => createSublotMutation.mutate(data)}
        sublot={null}
      />
    </div>
  );
};

export default LotsMapPage;