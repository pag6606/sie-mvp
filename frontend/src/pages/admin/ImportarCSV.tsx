import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

interface ImportResult {
  matriculados: number
  existentes: number
  errores?: { linea: number; motivo: string }[]
}

export default function ImportarCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/matriculas/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: (data) => setResult(data),
    onError: (err: unknown) => {
      const apiErr = err as ApiError
      setError(apiErr.response?.data?.mensaje || 'Error al importar')
    },
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
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <PageHead eyebrow="Matrícula" title="Importar matrícula" subtitle="Importa matrículas masivas desde un archivo CSV." />
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
              <div className="rounded-lg border border-success bg-success/10 p-6 text-center">
                <p className="text-3xl font-bold text-success">{result.matriculados}</p>
                <p className="text-sm text-emerald-600">Matriculados</p>
              </div>
              <div className="rounded-lg border border-warning bg-warning/10 p-6 text-center">
                <p className="text-3xl font-bold text-warning">{result.existentes}</p>
                <p className="text-sm text-amber-600">Ya existentes</p>
              </div>
              <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
                <p className="text-3xl font-bold text-destructive">{result.errores?.length || 0}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            </div>

            {result.errores && result.errores.length > 0 && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <h3 className="mb-2 font-medium text-destructive">Errores encontrados</h3>
                <ul className="space-y-1 text-sm text-destructive">
                  {result.errores.map((e, i) => (
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
      </div>
    </AppLayout>
  )
}
