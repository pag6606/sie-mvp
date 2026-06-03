import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import CrearPeriodo from '@/pages/admin/CrearPeriodo'
import ClonarSecciones from '@/pages/admin/ClonarSecciones'
import RevisarSecciones from '@/pages/admin/RevisarSecciones'
import ConfirmarApertura from '@/pages/admin/ConfirmarApertura'
import DashboardCierres from '@/pages/admin/DashboardCierres'
import DocenteDashboard from '@/pages/docente/DocenteDashboard'
import EstudianteDashboard from '@/pages/estudiante/EstudianteDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/periodos/nuevo" element={<CrearPeriodo />} />
      <Route path="/admin/periodos/:periodoId/clonar" element={<ClonarSecciones />} />
      <Route path="/admin/periodos/:periodoId/revisar" element={<RevisarSecciones />} />
      <Route path="/admin/periodos/:periodoId/confirmar" element={<ConfirmarApertura />} />
      <Route path="/admin/cierres" element={<DashboardCierres />} />
      <Route path="/docente" element={<DocenteDashboard />} />
      <Route path="/estudiante" element={<EstudianteDashboard />} />
    </Routes>
  )
}
