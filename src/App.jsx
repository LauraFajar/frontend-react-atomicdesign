import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import LoginPage from './components/pages/LoginPage/LoginPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import ForgotPassword from './components/pages/Auth/ForgotPassword';
import ResetPassword from './components/pages/Auth/ResetPassword';
import Register from './components/pages/Auth/Register';
import CropsPage from './components/pages/CropsPage/CropsPage';
import ActivitiesPage from './components/pages/ActivitiesPage/ActivitiesPage';
import CalendarPage from './components/pages/CalendarPage/CalendarPage';
import TratamientosPage from './components/pages/TratamientosPage/TratamientosPage';
import UsersPage from './components/pages/UsersPage/UsersPage';
import RestrictedAccess from './components/pages/RestrictedAccess/RestrictedAccess';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import CultivosMapPage from './components/pages/CultivosMapPage/CultivosMapPage';
import LotsMapPage from './components/pages/LotsMapPage/LotsMapPage';
import InventoryPage from './components/pages/InventoryPage/InventoryPage';
import FinanceDashboard from './components/pages/FinanceDashboard/FinanceDashboard';
import IotPage from './components/pages/IotPage/SimpleIotPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { isAuthenticated, loading, user, permissions } = useAuth()
  const isGuest = user?.role === 'invitado' || user?.roleId === 5
  const permsReady = Array.isArray(permissions)
  const hasSomePermission = permsReady && permissions.length > 0

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowGuest && isGuest) {
    if (!permsReady) {
      return <div>Cargando...</div>
    }
    if (!hasSomePermission) {
      return <Navigate to="/acceso-restringido" replace />
    }
  }

  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const isGuest = user?.role === 'invitado' || user?.roleId === 5;

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (isGuest && window.location.pathname !== '/acceso-restringido') {
    return <Navigate to="/acceso-restringido" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  const theme = createTheme({
    palette: {
      primary: { main: '#4CAF50' },
      success: { main: '#4CAF50' }
      ,info: { main: '#2196F3' }
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none'
          },
          contained: {
            color: '#fff'
          },
          containedPrimary: {
            color: '#fff'
          }
        }
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              color: '#fff'
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4CAF50',
              borderWidth: '2px'
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8
          }
        }
      }
    }
  });
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <div className="App">
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Routes>
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
              <Route path="/reset-password" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              {/* Rutas protegidas */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowGuest={true}>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/crops" element={
                <ProtectedRoute>
                  <CropsPage />
                </ProtectedRoute>
              } />
              <Route path="/activities" element={
                <ProtectedRoute>
                  <ActivitiesPage />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute allowGuest={true}>
                  <CalendarPage />
                </ProtectedRoute>
              } />
              <Route path="/tratamientos" element={
                <ProtectedRoute>
                  <TratamientosPage />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowGuest={false}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/mapa-cultivos" element={
                <ProtectedRoute allowGuest={true}>
                  <CultivosMapPage />
                </ProtectedRoute>
              } />
              <Route path="/mapa-lotes" element={
                <ProtectedRoute allowGuest={true}>
                  <LotsMapPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario" element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } />

              <Route path="/finanzas/dashboard" element={
                <ProtectedRoute>
                  <FinanceDashboard />
                </ProtectedRoute>
              } />

              <Route path="/iot" element={
                <ProtectedRoute>
                  <IotPage />
                </ProtectedRoute>
              } />

              {/* Acceso restringido */}
              <Route path="/acceso-restringido" element={<RestrictedAccess />} />

              {/* Redirecciones */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ThemeProvider>
          </div>
        </Router>
      </AlertProvider>
    </AuthProvider>
  )
}

export default App;
