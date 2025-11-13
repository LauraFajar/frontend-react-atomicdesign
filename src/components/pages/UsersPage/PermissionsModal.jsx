import React, { useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, Table, TableHead, TableRow, TableCell, TableBody, Chip, Autocomplete } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../../../contexts/AlertContext';
import { useAuth } from '../../../contexts/AuthContext';
import permissionService from '../../../services/permissionService';

const KNOWN_RESOURCES = [
  'actividades',
  'alertas',
  'almacenes',
  'categorias',
  'cultivos',
  'epa',
  'finanzas',
  'ingresos',
  'insumos',
  'inventario',
  'lotes',
  'movimientos',
  'permisos',
  'realiza',
  'rol',
  'salidas',
  'sensores',
  'sublotes',
  'tiene',
  'tiporol',
  'tratamientos',
  'usuarios',
  'utiliza',
];

const ENGLISH_TO_SPANISH_ACTIONS = {
  'read': 'ver',
  'create': 'crear',
  'update': 'editar',
  'edit': 'editar',
  'delete': 'eliminar',
  'export': 'exportar',
  'view': 'ver',
  'list': 'ver',
  'add': 'crear',
  'new': 'crear',
  'modify': 'editar',
  'remove': 'eliminar',
};

const normalizeAction = (action) => {
  const lower = (action || '').toString().trim().toLowerCase();
  return ENGLISH_TO_SPANISH_ACTIONS[lower] || lower;
};

const PermissionsModal = ({ open, onClose, user }) => {
  const alert = useAlert();
  const { refreshPermissions, user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: allPerms = [] } = useQuery({
    queryKey: ['permisos_all'],
    queryFn: permissionService.list,
    staleTime: 60 * 1000,
    enabled: open,
  });

  const normalizedPerms = useMemo(() => {
    return allPerms.map(p => ({
      ...p,
      accion: normalizeAction(p.accion),
      clave: `${p.recurso}:${normalizeAction(p.accion)}`,
    }));
  }, [allPerms]);

  const { data: userKeys = [] } = useQuery({
    queryKey: ['permisos_usuario', user?.id],
    queryFn: () => permissionService.getUserKeys(user.id),
    enabled: open && Boolean(user?.id),
  });

  const assignedSet = useMemo(() => {
    // Normalizar todas las claves de usuario para que coincidan con las claves normalizadas
    const normalized = userKeys.map(key => {
      const parts = key.split(':');
      if (parts.length === 2) {
        const [resource, action] = parts;
        return `${resource}:${normalizeAction(action)}`;
      }
      return key;
    });
    return new Set(normalized);
  }, [userKeys]);

  const resources = useMemo(() => {
    const fromBD = new Set(normalizedPerms.map(p => p.recurso));
    const combined = new Set([...fromBD, ...KNOWN_RESOURCES]);
    return Array.from(combined).sort();
  }, [normalizedPerms]);

  const actionsByResource = useMemo(() => {
    const m = new Map();
    normalizedPerms.forEach(p => {
      if (!m.has(p.recurso)) m.set(p.recurso, new Set());
      m.get(p.recurso).add(p.accion);
    });
    const out = {};
    m.forEach((set, key) => { out[key] = Array.from(set).sort(); });
    return out;
  }, [normalizedPerms]);
  const defaultActions = useMemo(() => ['ver', 'crear', 'editar', 'eliminar', 'exportar'], []);

  const [recurso, setRecurso] = useState('');
  const [accion, setAccion] = useState('');
  const [loadingPermId, setLoadingPermId] = useState(null); // Rastrear qué permiso está siendo procesado
  const selectedKey = recurso && accion ? `${recurso}:${accion}` : '';
  const existingPerm = useMemo(() => normalizedPerms.find(p => p.clave === selectedKey), [normalizedPerms, selectedKey]);

  const createMutation = useMutation({
    mutationFn: permissionService.create,
    onSuccess: (createdPerm) => {
      alert.success('Éxito', 'Permiso creado.');
      try {
        queryClient.setQueryData(['permisos_all'], (old = []) => {
          const exists = (Array.isArray(old) ? old : []).some(p => p.id_permiso === createdPerm.id_permiso || (`${p.recurso}:${p.accion}`) === (`${createdPerm.recurso}:${createdPerm.accion}`));
          if (exists) return old;
          return [createdPerm, ...(Array.isArray(old) ? old : [])];
        });
      } catch (e) {
        // 
      }
      queryClient.invalidateQueries({ queryKey: ['permisos_all'] });
      queryClient.refetchQueries({ queryKey: ['permisos_all'] });
      if (authUser && user && authUser.id === user.id) refreshPermissions(authUser.id);
      setRecurso('');
      setAccion('');
    },
    onError: (err) => alert.error('Error', err.message || 'No se pudo crear el permiso'),
  });

  const assignMutation = useMutation({
    mutationFn: async (data) => {
      setLoadingPermId(data.id_permiso);
      try {
        return await permissionService.assign(data);
      } finally {
        setLoadingPermId(null);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permisos_usuario', user?.id] });
      await queryClient.refetchQueries({ queryKey: ['permisos_usuario', user?.id] });
      alert.success('Éxito', 'Permiso asignado al usuario.');
      if (authUser && user && authUser.id === user.id) refreshPermissions(authUser.id);
    },
    onError: (err) => alert.error('Error', err.message || 'No se pudo asignar el permiso'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (data) => {
      setLoadingPermId(data.id_permiso);
      try {
        return await permissionService.revoke(data);
      } finally {
        setLoadingPermId(null);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permisos_usuario', user?.id] });
      await queryClient.refetchQueries({ queryKey: ['permisos_usuario', user?.id] });
      alert.success('Éxito', 'Permiso revocado del usuario.');
      if (authUser && user && authUser.id === user.id) refreshPermissions(authUser.id);
    },
    onError: (err) => alert.error('Error', err.message || 'No se pudo revocar el permiso'),
  });

  const handleCreateIfMissing = () => {
    if (!recurso || !accion) return;
    if (existingPerm) return;
    createMutation.mutate({ recurso, accion, nombre_permiso: `${recurso}:${accion}`, descripcion: '' });
  };

  const handleAssign = () => {
    if (!existingPerm) return;
    assignMutation.mutate({ id_usuario: user.id, id_permiso: existingPerm.id_permiso });
  };

  const handleRevoke = () => {
    if (!existingPerm) return;
    revokeMutation.mutate({ id_usuario: user.id, id_permiso: existingPerm.id_permiso });
  };

  const isAssigned = selectedKey && assignedSet.has(selectedKey);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Permisos de Usuario</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Chip label={`Usuario: ${user?.nombres || user?.email || user?.id}`} sx={{ bgcolor: '#E8F5E9', color: 'var(--primary-green)', mr: 1 }} />
          <Chip label={`ID: ${user?.id}`} sx={{ bgcolor: '#F3F4F6' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              freeSolo
              options={resources}
              value={recurso || ''}
              onChange={(_, newValue) => { setRecurso(newValue || ''); setAccion(''); }}
              inputValue={recurso || ''}
              onInputChange={(_, newInput) => setRecurso((newInput || '').trim())}
              renderInput={(params) => (
                <TextField {...params} label="Recurso" placeholder="ej: actividades, inventario..." />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              freeSolo
              options={(recurso ? (actionsByResource[recurso] || defaultActions) : defaultActions)}
              value={accion || ''}
              onChange={(_, newValue) => setAccion(newValue || '')}
              inputValue={accion || ''}
              onInputChange={(_, newInput) => setAccion((newInput || '').trim())}
              renderInput={(params) => (
                <TextField {...params} label="Acción" disabled={!recurso} placeholder="ej: ver, crear, editar, eliminar" />
              )}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {!existingPerm && (
            <Button
              variant="outlined"
              onClick={handleCreateIfMissing}
              disabled={!recurso || !accion || createMutation.isLoading}
              sx={{
                color: 'var(--primary-green) !important',
                borderColor: 'var(--primary-green) !important',
                '&:hover': { borderColor: 'var(--primary-green) !important' }
              }}
            >
              Crear permiso
            </Button>
          )}
          {existingPerm && !isAssigned && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: 'var(--primary-green)' }} 
              onClick={handleAssign} 
              disabled={loadingPermId === existingPerm?.id_permiso}
            >
              {loadingPermId === existingPerm?.id_permiso ? 'Asignando...' : 'Asignar'}
            </Button>
          )}
          {existingPerm && isAssigned && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleRevoke} 
              disabled={loadingPermId === existingPerm?.id_permiso}
            >
              {loadingPermId === existingPerm?.id_permiso ? 'Revocando...' : 'Revocar'}
            </Button>
          )}
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Recurso</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Asignado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {normalizedPerms.map(p => {
              const displayName = (p.nombre_permiso && p.nombre_permiso.trim() !== '')
                ? p.nombre_permiso
                : (p.clave || `${p.recurso}:${p.accion}`);
              return (
              <TableRow key={p.id_permiso}>
                <TableCell>{p.recurso}</TableCell>
                <TableCell>{p.accion}</TableCell>
                <TableCell>{displayName}</TableCell>
                <TableCell>
                  <Chip size="small" label={p.activo ? 'Activo' : 'Inactivo'} sx={{ bgcolor: p.activo ? '#E8F5E9' : '#FFEBEE', color: p.activo ? 'var(--primary-green)' : '#D32F2F' }} />
                </TableCell>
                <TableCell>
                  {assignedSet.has(p.clave) ? (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      onClick={() => revokeMutation.mutate({ id_usuario: user.id, id_permiso: p.id_permiso })}
                      disabled={loadingPermId === p.id_permiso}
                    >
                      {loadingPermId === p.id_permiso ? 'Revocando...' : 'Revocar'}
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      variant="contained" 
                      sx={{ bgcolor: 'var(--primary-green)' }} 
                      onClick={() => assignMutation.mutate({ id_usuario: user.id, id_permiso: p.id_permiso })}
                      disabled={loadingPermId === p.id_permiso}
                    >
                      {loadingPermId === p.id_permiso ? 'Asignando...' : 'Asignar'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: 'var(--primary-green)',
            color: '#fff',
            '&:hover': { bgcolor: 'var(--primary-green)' }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsModal;