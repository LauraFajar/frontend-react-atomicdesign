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

const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const isGuest = user?.role === 'invitado' || user?.roleId === 5

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowGuest && isGuest) {
    return <Navigate to="/acceso-restringido" replace />
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
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <div className="App">
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
              <Route path="/dashboard" element={
                <ProtectedRoute>
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
                <ProtectedRoute>
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
              <Route path="/acceso-restringido" element={<RestrictedAccess />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AlertProvider>
    </AuthProvider>
  )
}

export default App;