interface ImportarStepperProps {
  pasoActual: 1 | 2 | 3
}

const PASOS = [
  { numero: 1, label: 'Subir CSV' },
  { numero: 2, label: 'Revisar y editar' },
  { numero: 3, label: 'Resultado' }
] as const

export default function ImportarStepper({ pasoActual }: ImportarStepperProps) {
  return (
    <ol
      className="mb-8 flex items-center justify-center gap-2"
      aria-label="Pasos del wizard de importación"
    >
      {PASOS.map((paso, idx) => {
        const isActive = paso.numero === pasoActual
        const isComplete = paso.numero < pasoActual
        return (
          <li key={paso.numero} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isComplete
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isComplete ? '✓' : paso.numero}
            </div>
            <span
              className={`text-sm ${
                isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {paso.label}
            </span>
            {idx < PASOS.length - 1 && (
              <span className="mx-2 h-px w-8 bg-border" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
