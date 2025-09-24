import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/pages/LoginPage/LoginPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import ForgotPassword from './components/pages/Auth/ForgotPassword';
import ResetPassword from './components/pages/Auth/ResetPassword';
import Register from './components/pages/Auth/Register';
import './App.css'
import FitosanitarioPage from "./components/pages/Fitosanitario/Fitosanitario";
import FinanzasPage from "./components/pages/Finanzas/Finanzas";
import InventarioPage from "./components/pages/Inventario/Inventario";
import IoTPage from "./components/pages/IoT/IoT";
import CultivosPage from "./components/pages/Cultivos/Cultivos";
import ProtectedLayout from './components/Layouts/ProtectedLayout';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Componente para redireccionar si ya está autenticado
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" />
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
                  <ProtectedLayout>
                    <DashboardPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fitosanitario"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <FitosanitarioPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/finanzas"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <FinanzasPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/inventario"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <InventarioPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/iot"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <IoTPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/cultivos"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <CultivosPage />
                  </ProtectedLayout>
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
