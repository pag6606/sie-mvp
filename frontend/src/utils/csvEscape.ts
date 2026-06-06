const CARACTERES_FORMULA_INICIO = ['=', '+', '-', '@', '\t', '\r']

export function escapeFormula(valor: string): string {
  if (typeof valor !== 'string') return valor
  if (valor.length > 0 && CARACTERES_FORMULA_INICIO.includes(valor[0])) {
    return "'" + valor
  }
  return valor
}

export function escapeCsvCell(valor: string): string {
  const sinFormula = escapeFormula(valor)
  if (sinFormula.includes(',') || sinFormula.includes('"') || sinFormula.includes('\n') || sinFormula.includes('\r')) {
    return `"${sinFormula.replace(/"/g, '""')}"`
  }
  return sinFormula
}

export function escapeCsvRow(valores: string[]): string {
  return valores.map(escapeCsvCell).join(',')
}
