import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import PrivacyPage from '@/pages/auth/PrivacyPage'
import ActivatePage from '@/pages/auth/ActivatePage'
import { LoadingSkeleton } from '@/components/UIPatterns'

const PasswordResetPage = lazy(() => import('@/pages/auth/PasswordResetPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const CrearPeriodo = lazy(() => import('@/pages/admin/CrearPeriodo'))
const ClonarSecciones = lazy(() => import('@/pages/admin/ClonarSecciones'))
const RevisarSecciones = lazy(() => import('@/pages/admin/RevisarSecciones'))
const ConfirmarApertura = lazy(() => import('@/pages/admin/ConfirmarApertura'))
const DashboardCierres = lazy(() => import('@/pages/admin/DashboardCierres'))
const MatriculaPage = lazy(() => import('@/pages/admin/MatriculaPage'))
const ImportarCSV = lazy(() => import('@/pages/admin/ImportarCSV'))
const ImportarUsuariosPage = lazy(() => import('@/pages/admin/ImportarUsuariosPage'))
const UsuariosPage = lazy(() => import('@/pages/admin/UsuariosPage'))
const ParalelosPage = lazy(() => import('@/pages/admin/ParalelosPage'))
const AsignaturasPage = lazy(() => import('@/pages/admin/AsignaturasPage'))
const ConsentimientosPage = lazy(() => import('@/pages/admin/ConsentimientosPage'))
const AlertaTempranaPage = lazy(() => import('@/pages/admin/AlertaTempranaPage'))
const DocenteDashboard = lazy(() => import('@/pages/docente/DocenteDashboard'))
const AsistenciaPage = lazy(() => import('@/pages/docente/AsistenciaPage'))
const NotasPage = lazy(() => import('@/pages/docente/NotasPage'))
const CierrePage = lazy(() => import('@/pages/docente/CierrePage'))
const EsquemaEvaluacionPage = lazy(() => import('@/pages/docente/EsquemaEvaluacionPage'))
const EstudianteDashboard = lazy(() => import('@/pages/estudiante/EstudianteDashboard'))
const BoletinPage = lazy(() => import('@/pages/estudiante/BoletinPage'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacidad" element={<PrivacyPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/reset-password" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><PasswordResetPage /></Suspense>} />
      <Route path="/admin" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><AdminDashboard /></Suspense>} />
      <Route path="/admin/periodos/nuevo" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><CrearPeriodo /></Suspense>} />
      <Route path="/admin/periodos/:periodoId/clonar" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><ClonarSecciones /></Suspense>} />
      <Route path="/admin/periodos/:periodoId/revisar" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><RevisarSecciones /></Suspense>} />
      <Route path="/admin/periodos/:periodoId/confirmar" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><ConfirmarApertura /></Suspense>} />
      <Route path="/admin/cierres" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><DashboardCierres /></Suspense>} />
      <Route path="/admin/matricula" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><MatriculaPage /></Suspense>} />
      <Route path="/admin/matricula/importar" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><ImportarCSV /></Suspense>} />
      <Route path="/admin/usuarios" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><UsuariosPage /></Suspense>} />
      <Route path="/admin/usuarios/importar" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><ImportarUsuariosPage /></Suspense>} />
      <Route path="/admin/paralelos" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><ParalelosPage /></Suspense>} />
      <Route path="/admin/asignaturas" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><AsignaturasPage /></Suspense>} />
      <Route path="/admin/consentimientos" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><ConsentimientosPage /></Suspense>} />
      <Route path="/admin/alertas" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><AlertaTempranaPage /></Suspense>} />
      <Route path="/docente" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><DocenteDashboard /></Suspense>} />
      <Route path="/docente/:paraleloId/asistencia" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><AsistenciaPage /></Suspense>} />
      <Route path="/docente/:paraleloId/notas" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><NotasPage /></Suspense>} />
      <Route path="/docente/:paraleloId/cerrar" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><CierrePage /></Suspense>} />
      <Route path="/docente/:paraleloId/esquema" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><EsquemaEvaluacionPage /></Suspense>} />
      <Route path="/estudiante" element={<Suspense fallback={<LoadingSkeleton rows={4} />}><EstudianteDashboard /></Suspense>} />
      <Route path="/estudiante/boletin" element={<Suspense fallback={<LoadingSkeleton rows={3} />}><BoletinPage /></Suspense>} />
    </Routes>
  )
}
