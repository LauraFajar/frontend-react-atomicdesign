import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/pages/LoginPage/LoginPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import ForgotPassword from './components/pages/Auth/ForgotPassword';
import ResetPassword from './components/pages/Auth/ResetPassword';
import Register from './components/pages/Auth/Register';
import CropsPage from './components/pages/CropsPage/CropsPage';
import ActivitiesPage from './components/pages/ActivitiesPage/ActivitiesPage';
import CalendarPage from './components/pages/CalendarPage/CalendarPage';
import RestrictedAccess from './components/pages/RestrictedAccess/RestrictedAccess';
import './App.css'

// Componente para rutas protegidas
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
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return children
  }

  const isGuest = user?.role === 'invitado' || user?.roleId === 5

  return <Navigate to={isGuest ? '/acceso-restringido' : '/dashboard'} replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/actividades" 
              element={
                <ProtectedRoute>
                  <ActivitiesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario" 
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
