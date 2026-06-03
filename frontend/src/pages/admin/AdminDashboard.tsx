export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Alma</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <span className="text-sm font-medium text-gray-600">A</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-lg font-medium text-emerald-800">
                2026-1 Cerrado — Todas las notas publicadas
              </p>
              <p className="text-sm text-emerald-600">24 secciones · 500 estudiantes</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            ¿Lista para el período 2026-2?
          </h2>
          <p className="mt-2 text-gray-500">
            Configura secciones, asigna docentes y abre la matrícula en 4 pasos
          </p>
          <button className="mt-6 rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700">
            Configurar nuevo período
          </button>
        </div>

        <div className="mt-12 flex gap-4">
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            📋 Ver secciones
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            👥 Gestionar usuarios
          </button>
        </div>
      </main>
    </div>
  )
}
