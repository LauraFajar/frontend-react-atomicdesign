import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/userService';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import UserFormModal from './UserFormModal';
import ConfirmModal from '../../molecules/ConfirmModal/ConfirmModal';
import './UsersPage.css';

const roleConfig = {
  1: { label: 'Instructor', color: '#1976d2', bgColor: '#e3f2fd' },
  2: { label: 'Aprendiz', color: '#ed6c02', bgColor: '#fff3e0' },
  3: { label: 'Pasante', color: '#7b1fa2', bgColor: '#f3e5f5' },
  4: { label: 'Administrador', color: '#d32f2f', bgColor: '#ffebee' },
  5: { label: 'Invitado', color: '#757575', bgColor: '#f5f5f5' }
};

const UsersPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const isAdmin = user?.role === 'administrador';
  const canView = isAdmin;
  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    enabled: canView,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['allRoles'],
    queryFn: userService.getRoles,
    staleTime: Infinity,
    enabled: canView,
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.numero_documento.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (userData) => userService.updateUser(selectedUser.id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpenConfirmModal(false);
      setUserToDelete(null);
    },
  });

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleOpenModal = (userData = null) => {
    setSelectedUser(userData);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
  };

  const handleSaveUser = (userData) => {
    if (selectedUser) {
      if (!canEdit) return;
      updateMutation.mutate(userData);
    } else {
      if (!canCreate) return;
      createMutation.mutate(userData);
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete || !canDelete) return;
    deleteMutation.mutate(userToDelete.id);
  };

  const openDeleteConfirm = (userData) => {
    console.log('[UsersPage] Opening delete confirmation for user:', userData);

    if (!userData) {
      console.error('[UsersPage] Cannot delete user - no user data provided');
      return;
    }

    setUserToDelete(userData);
    setOpenConfirmModal(true);
  };

  if (!canView) {
    return (
      <div className="users-page">
        <Typography variant="h5" color="error">
          No tienes permisos para acceder a este módulo.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Usuario actual: {user?.nombres} - Rol: {user?.role} - Role ID: {user?.roleId}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Este módulo requiere permisos de Administrador.
        </Typography>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <CircularProgress className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Gestión de Usuarios</h1>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => handleOpenModal()}
            startIcon={<Add />}
            className="new-user-button"
          >
            Nuevo Usuario
          </Button>
        )}
      </div>

      <div className="search-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, email o documento..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search color="action" sx={{ mr: 1 }} />,
            className: "search-input"
          }}
        />
      </div>

      {(isError || createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error?.message || 
           createMutation.error?.message || 
           updateMutation.error?.message || 
           deleteMutation.error?.message || 
           'Ocurrió un error'}
        </Typography>
      )}

      <div className="users-table-container">
        <Table className="users-table">
          <TableHead>
            <TableRow>
              <TableCell>Nombres</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tipo Documento</TableCell>
              <TableCell>Número Documento</TableCell>
              <TableCell>Rol</TableCell>
              {(canEdit || canDelete) && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((userData) => (
                <TableRow key={userData.id}>
                  <TableCell>{userData.nombres}</TableCell>
                  <TableCell>{userData.email}</TableCell>
                  <TableCell>{userData.tipo_documento}</TableCell>
                  <TableCell>{userData.numero_documento}</TableCell>
                  <TableCell>
                    <Chip
                      label={(() => {
                        const roleLabel = userData.nombre_rol;
                        console.log(`[UsersPage] Rendering role for ${userData.nombres}:`, roleLabel);

                        if (typeof roleLabel === 'string') {
                          return roleLabel;
                        } else if (roleLabel && typeof roleLabel === 'object') {
                          const extractedName = roleLabel.nombre || roleLabel.name || String(roleLabel);
                          return extractedName.replace('[object Object]', 'Rol desconocido');
                        } else {
                          return `Rol ${userData.id_rol?.id_rol || userData.id_rol || 'desconocido'}`;
                        }
                      })()}
                      sx={{
                        backgroundColor: roleConfig[userData.id_rol?.id_rol || userData.id_rol]?.bgColor || '#f5f5f5',
                        color: roleConfig[userData.id_rol?.id_rol || userData.id_rol]?.color || '#757575',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton
                          onClick={() => handleOpenModal(userData)}
                          className="action-button edit-button"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          onClick={() => openDeleteConfirm(userData)}
                          className="action-button delete-button"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canEdit || canDelete ? 6 : 5} align="center">
                  {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        user={selectedUser}
        roles={roles}
      />

      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar el usuario "${userToDelete?.nombres}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default UsersPage;
