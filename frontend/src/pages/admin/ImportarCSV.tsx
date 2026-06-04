import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'
import { InlineError } from '@/components/UIPatterns'

export default function ImportarCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/matriculas/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: (data) => setResult(data),
    onError: (err: any) => setError(err.response?.data?.mensaje || 'Error al importar'),
  })

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    mutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />

      <main className="mx-auto max-w-2xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Importar matrícula</h2>
          <button onClick={() => navigate('/admin/matricula')} className="text-sm text-muted-foreground hover:underline">← Matrícula</button>
        </div>

        {!result ? (
          <form onSubmit={handleImport} className="space-y-6">
            <div className="rounded-lg border-2 border-dashed border-input bg-card p-12 text-center">
              <p className="text-4xl" aria-hidden="true">📁</p>
              <p className="mt-4 text-lg font-medium text-foreground">
                {file ? file.name : 'Arrastra tu archivo CSV'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">o haz clic para seleccionarlo</p>
              <input
                type="file"
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="mt-4 text-sm"
              />
              <p className="mt-4 text-xs text-muted-foreground">
                Columnas esperadas: email_estudiante, codigo_seccion
              </p>
            </div>

            {error && <InlineError message={error} />}

            <button
              type="submit"
              disabled={!file || mutation.isPending}
              className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Importando...' : 'Importar CSV'}
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
              className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90">
              Importar otro archivo
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
