import React, { useState, useEffect } from 'react';
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
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);

  const isAdmin = user?.role === 'administrador';
  const canView = isAdmin;
  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!canView) {
        console.log('[UsersPage] User cannot view users');
        return;
      }

      const [usersData, rolesData] = await Promise.all([
        userService.getUsers().catch(error => {
          console.error('Error loading users:', error);
          return [];
        }),
        userService.getRoles().catch(error => {
          console.error('Error loading roles:', error);
          return [];
        })
      ]);

      const rolesMap = {};
      if (rolesData && Array.isArray(rolesData)) {
        rolesData.forEach(role => {
          console.log('[UsersPage] Processing role:', role, 'Type:', typeof role);
          if (role && role.id_rol && role.nombre_rol) {
            rolesMap[role.id_rol] = role.nombre_rol;
            console.log(`[UsersPage] Role mapped: ${role.id_rol} -> ${role.nombre_rol}`);
          }
        });
      }

      const enrichedUsers = usersData?.map(user => {
        console.log(`[UsersPage] Processing user: ${user.nombres}`);
        console.log(`[UsersPage] User id_rol:`, user.id_rol, 'Type:', typeof user.id_rol);

        let finalRoleName;

        if (user.id_rol && typeof user.id_rol === 'object' && user.id_rol.nombre_rol) {
          finalRoleName = user.id_rol.nombre_rol;
        }
        else if (user.nombre_rol && typeof user.nombre_rol === 'string' && user.nombre_rol.trim()) {
          finalRoleName = user.nombre_rol.trim();
        }
        else {
          const userRoleId = typeof user.id_rol === 'object' ? user.id_rol.id_rol : user.id_rol;
          const roleName = rolesMap[userRoleId];
          finalRoleName = roleName || `Rol ${userRoleId || 'desconocido'}`;
        }

        console.log(`[UsersPage] User ${user.nombres} final role: ${finalRoleName}`);

        return {
          ...user,
          nombre_rol: finalRoleName
        };
      }) || [];

      setUsers(enrichedUsers);
      setRoles(rolesData || []);
      console.log('[UsersPage] State updated - users:', enrichedUsers.length, 'roles:', rolesData.length);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      if (error.message.includes('Sesión expirada')) {
        setError('Tu sesión ha expirada. Por favor inicia sesión nuevamente.');
      } else if (error.message.includes('No tienes permisos')) {
        setError('No tienes permisos para ver los usuarios.');
      } else {
        setError('Error al cargar los usuarios. Por favor intenta de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.numero_documento.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (userData = null) => {
    setSelectedUser(userData);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (userData) => {
    try {
      let successMsg = '';
      if (selectedUser) {
        if (!canEdit) throw new Error('No tienes permisos para editar usuarios');
        await userService.updateUser(selectedUser.id, userData);
        successMsg = 'Usuario actualizado exitosamente';
      } else {
        if (!canCreate) throw new Error('No tienes permisos para crear usuarios');
        await userService.createUser(userData);
        successMsg = 'Usuario creado exitosamente';
      }
      await loadData();
      handleCloseModal();
      console.log(successMsg);
    } catch (error) {
      console.error('Error al guardar el usuario:', error);

      if (error.message.includes('Sesión expirada')) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (error.message?.includes('No tienes permisos')) {
        setError('No tienes permisos para realizar esta acción.');
      } else {
        setError('Error al guardar el usuario. Por favor intenta de nuevo más tarde.');
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !canDelete) return;

    console.log('[UsersPage] handleDeleteUser called');
    console.log('[UsersPage] userToDelete:', userToDelete);

    if (!userToDelete.id) {
      console.error('[UsersPage] User has no ID:', userToDelete);
      setError(`Error: El usuario seleccionado no tiene un ID válido.`);
      setOpenConfirmModal(false);
      setUserToDelete(null);
      return;
    }

    const userId = String(userToDelete.id);
    console.log('[UsersPage] Converted user ID:', userId);

    try {
      setError('');
      console.log('[UsersPage] Deleting user with ID:', userId);

      await userService.deleteUser(userId);
      await loadData();
      setOpenConfirmModal(false);
      setUserToDelete(null);
      console.log('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('=== DELETE USER COMPONENT ERROR DEBUG ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('=== END COMPONENT DEBUG ===');

      if (error.message.includes('Sesión expirada')) {
        setError('Tu sesión ha expirada. Por favor inicia sesión nuevamente.');
      } else if (error.response?.status === 404) {
        setError(`El usuario "${userToDelete.nombres}" no fue encontrado.`);
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para eliminar usuarios.');
      } else if (error.response?.status >= 500) {
        setError('Error del servidor. Por favor intenta de nuevo más tarde.');
      } else if (error.message.includes('conexión') || error.message.includes('red')) {
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else if (error.message.includes('CORS')) {
        setError('Error de configuración del servidor.');
      } else if (error.message.includes('servidor')) {
        setError('No se pudo conectar con el servidor.');
      } else if (error.message.includes('undefined') || error.message.includes('null')) {
        setError('Error con el ID del usuario.');
      } else {
        setError(`Error al eliminar el usuario: ${error.message || 'Error desconocido'}`);
      }
      setOpenConfirmModal(false);
      setUserToDelete(null);
    }
  };

  const openDeleteConfirm = (userData) => {
    console.log('[UsersPage] Opening delete confirmation for user:', userData);

    if (!userData) {
      console.error('[UsersPage] Cannot delete user - no user data provided');
      setError('Error: No se pudo identificar el usuario a eliminar');
      return;
    }

    setUserToDelete(userData);
    setOpenConfirmModal(true);
    setError('');
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

  if (loading) {
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
        loading={loading}
      />
    </div>
  );
};

export default UsersPage;
