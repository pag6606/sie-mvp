export default function DocenteDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Diana R.</span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Mis Secciones — 2026-1</h2>

        <div className="mt-6 space-y-4">
          {[
            { course: 'Matemáticas 10-A', students: 23, schedule: 'Lun/Mié 8:00-9:30 · A-12', status: '⚠ Asistencia pendiente', statusColor: 'bg-amber-100 text-amber-700' },
            { course: 'Física 10-A', students: 20, schedule: 'Mar/Jue 10:00-11:30 · Lab-3', status: '📝 Notas en progreso', statusColor: 'bg-blue-100 text-blue-700' },
            { course: 'Literatura 10-A', students: 18, schedule: 'Mié/Vie 14:00-15:30 · B-5', status: '✅ Lista para cerrar', statusColor: 'bg-emerald-100 text-emerald-700' },
          ].map((s) => (
            <div key={s.course} className="rounded-lg border bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{s.course}</h3>
                  <p className="text-sm text-gray-500">{s.schedule}</p>
                </div>
                <span className="text-sm text-gray-500">{s.students} estudiantes</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.statusColor}`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
