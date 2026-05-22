import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProdutosPage from './pages/admin/ProdutosPage'
import CategoriasPage from './pages/admin/CategoriasPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import EventosPage from './pages/admin/EventosPage'
import RelatorioPage from './pages/admin/RelatorioPage'
import FiadoPage from './pages/admin/FiadoPage'
import PDVPage from './pages/pdv/PDVPage'

function RotaPrivada({ children }) {
  const { usuario } = useAuth()
  return usuario ? children : <Navigate to="/login" />
}

function RotaAdmin({ children }) {
  const { usuario, isAdmin } = useAuth()
  if (!usuario) return <Navigate to="/login" />
  if (!isAdmin()) return <Navigate to="/pdv" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pdv" element={<RotaPrivada><PDVPage /></RotaPrivada>} />
      <Route path="/admin" element={<RotaAdmin><DashboardPage /></RotaAdmin>} />
      <Route path="/admin/produtos" element={<RotaAdmin><ProdutosPage /></RotaAdmin>} />
      <Route path="/admin/categorias" element={<RotaAdmin><CategoriasPage /></RotaAdmin>} />
      <Route path="/admin/usuarios" element={<RotaAdmin><UsuariosPage /></RotaAdmin>} />
      <Route path="/admin/eventos" element={<RotaAdmin><EventosPage /></RotaAdmin>} />
      <Route path="/admin/relatorio/:eventoId" element={<RotaAdmin><RelatorioPage /></RotaAdmin>} />
      <Route path="/admin/fiado/:eventoId" element={<RotaAdmin><FiadoPage /></RotaAdmin>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

function AppContent() {
  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}