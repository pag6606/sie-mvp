import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

export default function ImportarCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/matriculas/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Importar matrícula</h2>
          <button onClick={() => navigate('/admin/matricula')} className="text-sm text-gray-500 hover:underline">← Matrícula</button>
        </div>

        {!result ? (
          <form onSubmit={handleImport} className="space-y-6">
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-4xl">📁</p>
              <p className="mt-4 text-lg font-medium text-gray-900">
                {file ? file.name : 'Arrastra tu archivo CSV'}
              </p>
              <p className="mt-1 text-sm text-gray-500">o haz clic para seleccionarlo</p>
              <input
                type="file"
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="mt-4 text-sm"
              />
              <p className="mt-4 text-xs text-gray-400">
                Columnas esperadas: email_estudiante, codigo_seccion
              </p>
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importando...' : 'Importar CSV'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-3xl font-bold text-emerald-700">{result.matriculados}</p>
                <p className="text-sm text-emerald-600">Matriculados</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-3xl font-bold text-amber-700">{result.existentes}</p>
                <p className="text-sm text-amber-600">Ya existentes</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-3xl font-bold text-red-700">{result.errores?.length || 0}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            </div>

            {result.errores?.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 font-medium text-red-800">Errores encontrados</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {result.errores.map((e: any, i: number) => (
                    <li key={i}>Línea {e.linea}: {e.motivo}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => { setResult(null); setFile(null) }}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              Importar otro archivo
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
