const PLANTILLA_URL = '/plantillas/plantilla-usuarios.csv'
const PLANTILLA_FILENAME = 'plantilla-usuarios.csv'

export async function descargarPlantillaCsv(): Promise<void> {
  const res = await fetch(PLANTILLA_URL)
  if (!res.ok) {
    throw new Error(`No se pudo cargar la plantilla (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = PLANTILLA_FILENAME
  a.click()
  URL.revokeObjectURL(url)
}

export const __test__ = { PLANTILLA_URL, PLANTILLA_FILENAME }
