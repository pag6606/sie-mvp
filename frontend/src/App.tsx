import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import DocenteDashboard from '@/pages/docente/DocenteDashboard'
import EstudianteDashboard from '@/pages/estudiante/EstudianteDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/docente" element={<DocenteDashboard />} />
      <Route path="/estudiante" element={<EstudianteDashboard />} />
    </Routes>
  )
}
