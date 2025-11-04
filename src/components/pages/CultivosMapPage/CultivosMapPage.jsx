import React from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import lotService from '../../../services/lotService';
import L from 'leaflet';
import { CircularProgress, Typography, Box, Paper, Fab } from '@mui/material';
import { MyLocation } from '@mui/icons-material';
import './CultivosMapPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const swapCoords = (coords) => {
  if (!Array.isArray(coords) || !Array.isArray(coords[0])) {
    return [];
  }
  return coords[0].map(coord => [coord[1], coord[0]]);
};

// Componente para el botón de centrado
const CenterMapController = ({ mapData }) => {
  const map = useMap();

  const handleCenterMap = () => {
    if (mapData && mapData.length > 0) {
      const allGeoJsonData = mapData.reduce((acc, lote) => {
        if (lote.coordenadas) acc.push(lote.coordenadas);
        lote.sublotes?.forEach(sublote => {
          if (sublote.coordenadas) acc.push(sublote.coordenadas);
        });
        return acc;
      }, []);

      if (allGeoJsonData.length > 0) {
        try {
          const featureGroup = L.featureGroup(allGeoJsonData.map(c => {
            if (c && c.type && c.coordinates) {
              return L.geoJSON(c);
            }
            return null;
          }).filter(Boolean));

          const bounds = featureGroup.getBounds();

          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
          }
        } catch (e) {
          console.error('Error al crear feature group o calcular límites:', e);
        }
      }
    }
  };

  return (
    <Fab 
      color="primary"
      aria-label="center map"
      onClick={handleCenterMap}
      sx={{
        position: 'absolute',
        top: 80, 
        right: 10, 
        zIndex: 1000 
      }}
    >
      <MyLocation />
    </Fab>
  );
};

const CultivosMapPage = () => {
  const { data: mapData = [], isLoading, isError, error } = useQuery({
    queryKey: ['lotesMapData'],
    queryFn: lotService.getMapData,
  });

  const lotOptions = { color: '#4CAF50', weight: 3 };
  const sublotOptions = { color: '#2196F3', weight: 2 };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando mapa...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ m: 4 }}>
        Error al cargar los datos del mapa: {error.message}
      </Typography>
    );
  }

  return (
    <div className="cultivos-map-page">
      <div className="cultivos-map-header">
        <h1 className="cultivos-map-title">Mapa de Lotes</h1>
      </div>
      <Paper elevation={2} sx={{ height: '60vh', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
        <MapContainer
          center={[1.89, -76.09]} // Coordenadas de la región general de los lotes
          zoom={8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          />

          {/* Controlador para centrar el mapa manualmente */}
          <CenterMapController mapData={mapData} />

          {mapData.map(lote => {
            const lotePositions = swapCoords(lote.coordenadas?.coordinates);
            return (
              <React.Fragment key={`lote-fragment-${lote.id_lote}`}>
                {lotePositions.length > 0 && (
                  <Polygon pathOptions={lotOptions} positions={lotePositions}>
                    <Popup><b>Lote: {lote.nombre_lote}</b><br />{lote.descripcion}</Popup>
                  </Polygon>
                )}
                {lote.sublotes?.map(sublote => {
                  const sublotePositions = swapCoords(sublote.coordenadas?.coordinates);
                  return sublotePositions.length > 0 ? (
                    <Polygon key={`sublote-${sublote.id_sublote}`} pathOptions={sublotOptions} positions={sublotePositions}>
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
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#4CAF50', mr: 1, border: '1px solid #388E3C' }} />
          <Typography variant="body2">Lote</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#2196F3', mr: 1, border: '1px solid #1976D2' }} />
          <Typography variant="body2">Sublote</Typography>
        </Box>
      </Box>
    </div>
  );
};

export default CultivosMapPage;