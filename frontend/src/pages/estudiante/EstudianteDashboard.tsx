export default function EstudianteDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Ernesto</span>
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900">Mis Calificaciones — 2026-1</h2>

        <div className="mt-4 space-y-3">
          {[
            { course: 'Matemáticas 10-A', teacher: 'Diana R.', grade: '16.6', color: 'text-emerald-600', expanded: true },
            { course: 'Física 10-A', teacher: 'Carlos M.', grade: '18.2', color: 'text-emerald-600' },
            { course: 'Literatura 10-A', teacher: 'Laura P.', grade: '14.0', color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.course} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{s.course}</h3>
                  <p className="text-sm text-gray-500">{s.teacher}</p>
                </div>
                <span className={`text-2xl font-bold ${s.color}`}>{s.grade}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
          📥 Descargar boletín PDF
        </button>
      </main>
    </div>
  )
}
