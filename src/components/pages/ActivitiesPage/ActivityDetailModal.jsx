import React, { useMemo, useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import activityService from '../../../services/activityService'
import config from '../../../config/environment'

const statusConfig = {
  pendiente: { color: '#f57c00', bgColor: '#fff3e0', label: 'Pendiente' },
  en_progreso: { color: '#1976d2', bgColor: '#e3f2fd', label: 'En Progreso' },
  completada: { color: '#2e7d32', bgColor: '#e8f5e9', label: 'Completada' },
  cancelada: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelada' },
}

const ActivityDetailModal = ({ open, onClose, activity }) => {
  const activityId = activity?.id
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['activityPhotos', activityId],
    queryFn: () => activityService.getActivityPhotos(activityId),
    enabled: !!activityId,
  })

  const { data: recursos = [] } = useQuery({
    queryKey: ['activityResources', activityId],
    queryFn: () => activityService.getRecursosByActividad(activityId),
    enabled: !!activityId,
  })

  const latestPhoto = useMemo(() => (Array.isArray(photos) && photos.length > 0 ? photos[0] : null), [photos])
  const raw = latestPhoto?.ruta_foto || ''
  const rel = raw ? (raw.startsWith('/') ? raw : `/${raw}`) : ''
  const base = (config.api.baseURL || '').replace(/\/$/, '')
  const abs = raw ? (raw.startsWith('http') ? raw : `${base}${rel}`) : ''
  const [imgSrc, setImgSrc] = useState(abs)
  useEffect(() => { setImgSrc(abs) }, [abs])

  if (!activity) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalles de Actividad</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{activity.tipo_actividad}</Typography>
          <Typography variant="body2" color="textSecondary">{new Date(activity.fecha).toLocaleDateString('es-ES')}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Responsable</Typography>
          <Typography variant="body1">{activity.responsable}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Detalles</Typography>
          <Typography variant="body1">{activity.detalles}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Estado</Typography>
          <Chip
            label={statusConfig[activity.estado]?.label || activity.estado}
            sx={{ backgroundColor: statusConfig[activity.estado]?.bgColor, color: statusConfig[activity.estado]?.color }}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Recursos utilizados</Typography>
          {Array.isArray(recursos) && recursos.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              {recursos.map((r, idx) => (
                <Box key={idx} sx={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:1, mb:1 }}>
                  <Typography variant="body2">{String(r.nombre_insumo || r.id_insumo)}</Typography>
                  <Typography variant="body2">{r.horas_uso != null ? `Horas: ${r.horas_uso}` : `Cantidad: ${r.cantidad ?? 0}`}</Typography>
                  <Typography variant="body2">Costo unitario: {r.costo_unitario != null ? r.costo_unitario : 'N/A'}</Typography>
                  <Typography variant="body2">{r.horas_uso != null ? 'Herramienta' : 'Consumible'}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2">Sin recursos registrados.</Typography>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Fotodocumentación</Typography>
          {isLoading ? (
            <Typography variant="body2">Cargando...</Typography>
          ) : latestPhoto ? (
            <Box sx={{ mt: 1 }}>
              <img src={imgSrc} alt={latestPhoto.descripcion || 'Foto de actividad'} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} onError={() => { if (rel) setImgSrc(rel) }} />
              {latestPhoto.descripcion && (
                <Typography variant="body2" sx={{ mt: 1 }}>{latestPhoto.descripcion}</Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2">No hay fotos para esta actividad.</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} sx={{ backgroundColor: 'var(--primary-green)' }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ActivityDetailModal
