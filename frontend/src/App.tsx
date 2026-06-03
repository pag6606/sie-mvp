import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import CrearPeriodo from '@/pages/admin/CrearPeriodo'
import ClonarSecciones from '@/pages/admin/ClonarSecciones'
import RevisarSecciones from '@/pages/admin/RevisarSecciones'
import ConfirmarApertura from '@/pages/admin/ConfirmarApertura'
import DashboardCierres from '@/pages/admin/DashboardCierres'
import MatriculaPage from '@/pages/admin/MatriculaPage'
import ImportarCSV from '@/pages/admin/ImportarCSV'
import DocenteDashboard from '@/pages/docente/DocenteDashboard'
import AsistenciaPage from '@/pages/docente/AsistenciaPage'
import NotasPage from '@/pages/docente/NotasPage'
import CierrePage from '@/pages/docente/CierrePage'
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
      <Route path="/admin/matricula" element={<MatriculaPage />} />
      <Route path="/admin/matricula/importar" element={<ImportarCSV />} />
      <Route path="/docente" element={<DocenteDashboard />} />
      <Route path="/docente/:seccionId/asistencia" element={<AsistenciaPage />} />
      <Route path="/docente/:seccionId/notas" element={<NotasPage />} />
      <Route path="/docente/:seccionId/cerrar" element={<CierrePage />} />
      <Route path="/estudiante" element={<EstudianteDashboard />} />
    </Routes>
  )
}
