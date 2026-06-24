import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { LoadingSkeleton, InlineError, ConfirmModal } from '@/components/UIPatterns'
import {
  useEstructuraAcademica,
  useMalla,
  useTodasLasMallas,
  useCrearNivel,
  useEliminarNivel,
  useCrearSubnivel,
  useEliminarSubnivel,
  useCrearGrado,
  useEliminarGrado,
  useCrearMalla,
  useEliminarMalla,
  type NivelTreeDTO,
} from '@/hooks/useEstructuraAcademica'
import { useAsignaturas, useAreas } from '@/hooks/useAsignaturas'
import { useParalelosPaginadas } from '@/hooks/useParalelos'
import { usePeriodos } from '@/hooks/usePeriodos'
import Pagination from '@/components/Pagination'
import type { ApiError } from '@/types/api'

// ── Helpers ──
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() }
function errorMsg(err: unknown, fallback: string): string {
  const a = err as ApiError
  return a?.response?.data?.mensaje || a?.response?.data?.error || a?.message || fallback
}

const AREA_COLORS: Record<string, string> = {
  MAT: 'bg-blue-100 text-blue-800 border-blue-300',
  CN: 'bg-orange-100 text-orange-800 border-orange-300',
  CS: 'bg-red-100 text-red-800 border-red-300',
  LL: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  LEN: 'bg-teal-100 text-teal-800 border-teal-300',
  ECA: 'bg-purple-100 text-purple-800 border-purple-300',
  EF: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MI: 'bg-slate-100 text-slate-800 border-slate-300',
}

function areaBadge(codigo: string | null | undefined, _nombre?: string | null | undefined) {
  const color = AREA_COLORS[codigo ?? ''] || 'bg-gray-100 text-gray-800 border-gray-300'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${color}`}>{codigo || '?'}</span>
}

type HubTab = 'estructura' | 'asignaturas' | 'paralelos'

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function EstructuraAcademicaPage() {
  const { data: arbol, isLoading, error } = useEstructuraAcademica()
  const { data: periodos = [] } = usePeriodos()
  const { data: asignaturas = [] } = useAsignaturas()
  const { data: areas = [] } = useAreas()
  const { data: todasLasMallas = [] } = useTodasLasMallas()

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState<HubTab>('estructura')
  const [showMatrix, setShowMatrix] = useState(false)

  // ── Tree state ──
  const [selectedGradoId, setSelectedGradoId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; label: string } | null>(null)

  // ── Form Nivel ── (inline, at top of left panel)
  const [showNivelForm, setShowNivelForm] = useState(false)
  const [nivelCodigo, setNivelCodigo] = useState('')
  const [nivelNombre, setNivelNombre] = useState('')
  const [nivelOrden, setNivelOrden] = useState(1)
  const [nivelFormError, setNivelFormError] = useState('')
  const crearNivelMtn = useCrearNivel()

  // ── Subnivel form ──
  const [showSubnivelForm, setShowSubnivelForm] = useState(false)
  const [subnivelNivelId, setSubnivelNivelId] = useState('')

  // ── Grado form ──
  const [showGradoForm, setShowGradoForm] = useState(false)
  const [gradoSubnivelId, setGradoSubnivelId] = useState('')

  // ── Malla ──
  const { data: malla, isLoading: mallaLoading } = useMalla(selectedGradoId ?? undefined)
  const [showMallaForm, setShowMallaForm] = useState(false)
  const [mallaAsignaturaId, setMallaAsignaturaId] = useState('')
  const [mallaHoras, setMallaHoras] = useState(4)
  const [mallaObligatoria, setMallaObligatoria] = useState(true)
  const [mallaFormError, setMallaFormError] = useState('')
  const crearMallaMtn = useCrearMalla()
  const eliminarMallaMtn = useEliminarMalla()

  // ── Grado seleccionado (for detail panel) ──
  const gradoSeleccionado = useMemo(() => {
    if (!arbol) return null
    return arbol.flatMap(n => n.subniveles).flatMap(s => s.grados).find(g => g.id === selectedGradoId) ?? null
  }, [arbol, selectedGradoId])

  // ── Paralelos tab state ──
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  useMemo(() => {
    if (periodos.length > 0 && !selectedPeriodo) {
      const activo = periodos.find(p => p.estado !== 'CERRADO')
      if (activo) setSelectedPeriodo(activo.id)
    }
  }, [periodos, selectedPeriodo])

  // ── Loading guard ──
  if (isLoading) return <AppLayout role="admin"><LoadingSkeleton rows={8} /></AppLayout>
  if (error) return <AppLayout role="admin"><div className="p-6"><InlineError message="Error al cargar" /></div></AppLayout>

  return (
    <AppLayout role="admin">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* ─── LEFT PANEL: TREE ─── */}
        <div className="w-72 min-w-[16rem] border-r bg-card overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Niveles</h2>
            <button onClick={() => setShowNivelForm(!showNivelForm)}
              className="text-xs text-primary hover:underline">{showNivelForm ? '✕' : '+ Nivel'}</button>
          </div>

          {showNivelForm && (
            <div className="rounded border border-primary/30 bg-primary/5 p-3 mb-3">
              {nivelFormError && <InlineError message={nivelFormError} />}
              <form onSubmit={e => {
                e.preventDefault(); setNivelFormError('')
                crearNivelMtn.mutate({ codigo: nivelCodigo.toUpperCase(), nombre: capitalize(nivelNombre), orden: nivelOrden }, {
                  onSuccess: () => { setShowNivelForm(false); setNivelCodigo(''); setNivelNombre(''); setNivelOrden(1) },
                  onError: (err) => setNivelFormError(errorMsg(err, 'Error')),
                })
              }} className="space-y-2">
                <input value={nivelCodigo} onChange={e => setNivelCodigo(e.target.value)} required placeholder="EGB"
                  className="w-full rounded border border-input px-2 py-1 text-xs" />
                <input value={nivelNombre} onChange={e => setNivelNombre(e.target.value)} required placeholder="Educación General Básica"
                  className="w-full rounded border border-input px-2 py-1 text-xs" />
                <div className="flex gap-2">
                  <input type="number" min={1} value={nivelOrden} onChange={e => setNivelOrden(Number(e.target.value))}
                    className="w-14 rounded border border-input px-2 py-1 text-xs" />
                  <button type="submit" disabled={crearNivelMtn.isPending}
                    className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground">Crear</button>
                </div>
              </form>
            </div>
          )}

          <TreePanel
            arbol={arbol}
            selectedGradoId={selectedGradoId}
            onSelectGrado={setSelectedGradoId}
            onAddSubnivel={(nivelId) => { setSubnivelNivelId(nivelId); setShowSubnivelForm(true); setShowGradoForm(false) }}
            onAddGrado={(subId) => { setGradoSubnivelId(subId); setShowGradoForm(true); setShowSubnivelForm(false) }}
            onDelete={(type, id, label) => setConfirmDelete({ type, id, label })}
          />

          {showSubnivelForm && (
            <SubnivelFormInline nivelId={subnivelNivelId} onClose={() => setShowSubnivelForm(false)} />
          )}
          {showGradoForm && (
            <GradoFormInline subnivelId={gradoSubnivelId} onClose={() => setShowGradoForm(false)} />
          )}
        </div>

        {/* ─── RIGHT PANEL: CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Area color legend */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
            {areas.map((a: {id: string; codigo: string; nombre: string}) => (
              <span key={a.id} className={`px-2 py-0.5 rounded ${AREA_COLORS[a.codigo] || ''}`}>
                {a.codigo} {a.nombre}
              </span>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center justify-between mb-4 border-b">
            <div className="flex gap-4">
              {(['estructura', 'asignaturas', 'paralelos'] as HubTab[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab === 'estructura' ? '📋 Estructura' : tab === 'asignaturas' ? '📘 Asignaturas' : '📐 Paralelos'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowMatrix(!showMatrix)}
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                showMatrix ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:bg-muted'
              }`}>
              {showMatrix ? '✕ Cerrar Matriz' : '📊 Vista Matriz'}
            </button>
          </div>

          {showMatrix ? (
            <VistaMatriz
              arbol={arbol}
              asignaturas={asignaturas}
              areas={areas}
              todasLasMallas={todasLasMallas}
              selectedGradoId={selectedGradoId}
              onSelectCell={(gradoId, _asigId) => {
                setSelectedGradoId(gradoId)
                setShowMatrix(false)
              }}
            />
          ) : (
            <>
              {activeTab === 'estructura' && (
                <TabEstructura
                  gradoSeleccionado={gradoSeleccionado}
                  malla={malla}
                  mallaLoading={mallaLoading}
                  asignaturas={asignaturas}
                  selectedGradoId={selectedGradoId}
                  showMallaForm={showMallaForm}
                  setShowMallaForm={setShowMallaForm}
                  mallaAsignaturaId={mallaAsignaturaId}
                  setMallaAsignaturaId={setMallaAsignaturaId}
                  mallaHoras={mallaHoras}
                  setMallaHoras={setMallaHoras}
                  mallaObligatoria={mallaObligatoria}
                  setMallaObligatoria={setMallaObligatoria}
                  mallaFormError={mallaFormError}
                  setMallaFormError={setMallaFormError}
                  crearMallaMtn={crearMallaMtn}
                  eliminarMallaMtn={eliminarMallaMtn}
                  arbol={arbol}
                  areas={areas}
                  todasLasMallas={todasLasMallas}
                  onSelectGrado={(id: string) => { setSelectedGradoId(id) }}
                />
              )}
              {activeTab === 'asignaturas' && (
                <TabAsignaturas asignaturas={asignaturas} areas={areas} arbol={arbol}
                  todasLasMallas={todasLasMallas} selectedGradoId={selectedGradoId} />
              )}
              {activeTab === 'paralelos' && (
                <TabParalelos periodos={periodos} selectedPeriodo={selectedPeriodo}
                  onPeriodoChange={setSelectedPeriodo}
                  selectedGradoId={selectedGradoId}
                  gradosEnArbol={arbol?.flatMap(n => n.subniveles).flatMap(s => s.grados) ?? []}
                  asignaturas={asignaturas} todasLasMallas={todasLasMallas} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Confirmar eliminación"
        message={`¿Eliminar ${confirmDelete?.label}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!confirmDelete) return
          const { type, id } = confirmDelete
          if (type === 'nivel') useEliminarNivel().mutate(id); else if (type === 'subnivel') useEliminarSubnivel().mutate(id); else if (type === 'grado') useEliminarGrado().mutate(id)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TREE PANEL (LEFT)
// ═══════════════════════════════════════════════════════════════
function TreePanel({ arbol, selectedGradoId, onSelectGrado, onAddSubnivel, onAddGrado, onDelete }: {
  arbol: NivelTreeDTO[] | undefined
  selectedGradoId: string | null
  onSelectGrado: (id: string) => void
  onAddSubnivel: (nivelId: string) => void
  onAddGrado: (subnivelId: string) => void
  onDelete: (type: string, id: string, label: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (!arbol || arbol.length === 0) return <p className="text-xs text-muted-foreground">Sin niveles</p>

  return (
    <div className="space-y-1 text-sm">
      {arbol.map(nivel => (
        <div key={nivel.id}>
          <div className="flex items-center gap-1 py-1 cursor-pointer hover:bg-muted rounded px-1"
            onClick={() => setCollapsed(p => ({ ...p, [nivel.id]: !p[nivel.id] }))}>
            <span className="text-xs text-muted-foreground">{collapsed[nivel.id] ? '▶' : '▼'}</span>
            <span className="font-medium">{nivel.codigo}</span>
            <span className="text-xs text-muted-foreground ml-1">{nivel.subniveles.length} subniveles</span>
            <button onClick={e => { e.stopPropagation(); onDelete('nivel', nivel.id, `nivel ${nivel.codigo}`) }}
              className="ml-auto text-[10px] text-red-400 hover:text-red-600">✕</button>
          </div>
          {!collapsed[nivel.id] && (
            <div className="ml-3 space-y-0.5 border-l-2 border-muted pl-2">
              {nivel.subniveles.map(sub => (
                <div key={sub.id}>
                  <div className="flex items-center gap-1 py-0.5">
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => setCollapsed(p => ({ ...p, [sub.id]: !p[sub.id] }))}>
                      {collapsed[sub.id] ? '▶' : '▼'}
                    </span>
                    <span className="text-xs font-medium">{sub.codigo}</span>
                    <span className="text-[10px] text-muted-foreground">{sub.grados.length} grados</span>
                    <button onClick={() => onDelete('subnivel', sub.id, `subnivel ${sub.codigo}`)}
                      className="ml-auto text-[10px] text-red-400 hover:text-red-600">✕</button>
                  </div>
                  {!collapsed[sub.id] && sub.grados.map(g => (
                    <div key={g.id}
                      className={`flex items-center gap-1 py-0.5 pl-3 rounded cursor-pointer text-xs hover:bg-muted transition-colors ${
                        selectedGradoId === g.id ? 'bg-primary/10 font-medium' : ''
                      }`}
                      onClick={() => onSelectGrado(g.id)}>
                      <span>📘 {g.codigo}</span>
                      <span className="text-muted-foreground ml-1">({g.nombre.split(' ')[0]})</span>
                      <button onClick={e => { e.stopPropagation(); onDelete('grado', g.id, `grado ${g.codigo}`) }}
                        className="ml-auto text-[10px] text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                  <button onClick={() => onAddGrado(sub.id)}
                    className="text-[10px] text-primary hover:underline pl-3">+ Grado</button>
                </div>
              ))}
              <button onClick={() => onAddSubnivel(nivel.id)}
                className="text-[10px] text-primary hover:underline">+ Subnivel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB: ESTRUCTURA (malla per grade)
// ═══════════════════════════════════════════════════════════════
function TabEstructura({ gradoSeleccionado, malla, mallaLoading, asignaturas, selectedGradoId,
  showMallaForm, setShowMallaForm, mallaAsignaturaId, setMallaAsignaturaId, mallaHoras, setMallaHoras,
  mallaObligatoria, setMallaObligatoria, mallaFormError, setMallaFormError,
  crearMallaMtn, eliminarMallaMtn, arbol, areas, todasLasMallas, onSelectGrado }: any) {

  if (!selectedGradoId || !gradoSeleccionado) {
    const niveles = arbol ?? []
    const totalNiveles = niveles.length
    const totalSubniveles = niveles.reduce((s: number, n: any) => s + n.subniveles.length, 0)
    const totalGrados = niveles.reduce((s: number, n: any) => s + n.subniveles.reduce((s2: number, sn: any) => s2 + sn.grados.length, 0), 0)
    const totalAsignaturas = asignaturas?.length ?? 0
    const totalMallas = todasLasMallas?.length ?? 0
    const totalAreas = areas?.length ?? 0
    const totalHorasGlobal = todasLasMallas?.reduce((s: number, m: any) => s + m.horasSemanales, 0) ?? 0

    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">📊 Resumen Académico</h2>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalNiveles}</div>
            <div className="text-xs text-muted-foreground mt-1">Niveles</div>
            <div className="text-[10px] text-muted-foreground">EGB · BGU</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalSubniveles}</div>
            <div className="text-xs text-muted-foreground mt-1">Subniveles</div>
            <div className="text-[10px] text-muted-foreground">PREP · BE · BM · BS · BGU</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalGrados}</div>
            <div className="text-xs text-muted-foreground mt-1">Grados</div>
            <div className="text-[10px] text-muted-foreground">1EGB → 3BGU</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalAreas}</div>
            <div className="text-xs text-muted-foreground mt-1">Áreas</div>
            <div className="text-[10px] text-muted-foreground">{areas?.map((a: any) => a.codigo).join(' · ')}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium">Asignaturas</div>
            <div className="text-3xl font-bold mt-1">{totalAsignaturas}</div>
            <div className="text-xs text-muted-foreground mt-1">En el catálogo oficial MinEduc</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium">Malla Curricular</div>
            <div className="text-3xl font-bold mt-1">{totalMallas}</div>
            <div className="text-xs text-muted-foreground mt-1">{totalHorasGlobal} períodos/semana en total</div>
          </div>
        </div>

        {/* Grados por nivel con conteo de asignaturas */}
        <h3 className="text-sm font-semibold mb-3">📘 Grados — haz clic en uno para ver su malla</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {niveles.map((nivel: any) => (
            <div key={nivel.id} className="rounded-lg border bg-card p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{nivel.codigo}</div>
              {nivel.subniveles.map((sub: any) => (
                <div key={sub.id} className="mb-2">
                  <div className="text-[10px] text-muted-foreground">{sub.codigo}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sub.grados.map((g: any) => {
                      const count = todasLasMallas?.filter((m: any) => m.gradoId === g.id).length ?? 0
                      return (
                        <button key={g.id}
                          onClick={() => onSelectGrado?.(g.id)}
                          className="px-2 py-1 rounded text-[10px] bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                          {g.codigo}
                          <span className="text-[9px] text-muted-foreground ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          💡 Selecciona un grado en el árbol izquierdo o haz clic en 📊 Vista Matriz para el panorama completo
        </p>
      </div>
    )
  }

  const totalHoras = malla?.reduce((s: number, m: any) => s + m.horasSemanales, 0) ?? 0

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{gradoSeleccionado.codigo} — {gradoSeleccionado.nombre}</h2>
        <p className="text-sm text-muted-foreground">Edad: {gradoSeleccionado.edadReferencial || '—'} · {malla?.length ?? 0} asignaturas · {totalHoras} períodos/sem</p>
      </div>

      {mallaLoading ? <LoadingSkeleton rows={5} /> : (
        <>
          {malla && malla.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Área</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Asignatura</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-16">H/s</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-12">Obl</th>
                    <th className="px-3 py-2 text-right w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {malla.map((m: any) => (
                    <tr key={m.id} className="border-b hover:bg-muted/50">
                      <td className="px-3 py-2">{areaBadge(m.areaCodigo || m.asignaturaCodigo, null)}</td>
                      <td className="px-3 py-2 text-sm">{m.asignaturaCodigo} — {m.asignaturaNombre}</td>
                      <td className="px-3 py-2 text-center text-sm font-mono">{m.horasSemanales}</td>
                      <td className="px-3 py-2 text-center text-xs">{m.obligatoria ? '✅' : '☐'}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => { if (confirm(`¿Quitar ${m.asignaturaCodigo}?`)) eliminarMallaMtn.mutate(m.id) }}
                          className="text-xs text-red-500 hover:underline">Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Total: {malla.length} asignaturas · {totalHoras} períodos pedagógicos/semana
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">Este grado no tiene asignaturas en su malla.</p>
            </div>
          )}

          <div className="mt-4">
            <button onClick={() => setShowMallaForm(!showMallaForm)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
              {showMallaForm ? 'Cancelar' : '+ Añadir asignatura'}
            </button>

            {showMallaForm && (
              <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                {mallaFormError && <InlineError message={mallaFormError} />}
                <form onSubmit={e => {
                  e.preventDefault(); if (!mallaAsignaturaId) return; setMallaFormError('')
                  crearMallaMtn.mutate(
                    { asignaturaId: mallaAsignaturaId, gradoId: selectedGradoId, horasSemanales: mallaHoras, obligatoria: mallaObligatoria },
                    { onSuccess: () => { setShowMallaForm(false); setMallaAsignaturaId(''); setMallaHoras(4) },
                      onError: (err: any) => setMallaFormError(errorMsg(err, 'Error')) })
                }} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Asignatura</label>
                    <select value={mallaAsignaturaId} onChange={e => setMallaAsignaturaId(e.target.value)} required
                      className="mt-1 block rounded border border-input px-3 py-2 text-sm min-w-[200px]">
                      <option value="">Seleccionar...</option>
                      {asignaturas.filter((a: any) => !malla?.some((m: any) => m.asignaturaId === a.id)).map((a: any) => (
                        <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Horas</label>
                    <input type="number" min={1} value={mallaHoras} onChange={e => setMallaHoras(Number(e.target.value))}
                      className="mt-1 block w-16 rounded border border-input px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <input type="checkbox" id="malla-obl" checked={mallaObligatoria} onChange={e => setMallaObligatoria(e.target.checked)} />
                    <label htmlFor="malla-obl" className="text-sm">Obligatoria</label>
                  </div>
                  <button type="submit" disabled={crearMallaMtn.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Añadir</button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB: ASIGNATURAS (grouped by area, con filtro por nivel)
// ═══════════════════════════════════════════════════════════════
function TabAsignaturas({ asignaturas, areas, arbol, todasLasMallas, selectedGradoId }: {
  asignaturas: any[]; areas: any[]; arbol: NivelTreeDTO[] | undefined; todasLasMallas: any[]; selectedGradoId: string | null
}) {
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedNivel, setSelectedNivel] = useState<string>('')

  // Sincronizar: cuando se selecciona un grado en el árbol, auto-filtrar su nivel
  useEffect(() => {
    if (selectedGradoId && arbol) {
      for (const nivel of arbol) {
        for (const sub of nivel.subniveles) {
          if (sub.grados.some((g: any) => g.id === selectedGradoId)) {
            setSelectedNivel(nivel.id)
            return
          }
        }
      }
    }
  }, [selectedGradoId, arbol])

  // Agrupar asignaturas por área, filtrando por nivel seleccionado
  const areasConAsigs = areas.map(area => ({
    ...area,
    // Filtro doble: por área Y por nivel (si seleccionado)
    asignaturas: asignaturas.filter(a =>
      a.areaId === area.id &&
      (!selectedNivel || a.niveles?.some((n: any) => n.nivelId === selectedNivel))
    )
  })).filter(a => a.asignaturas.length > 0)

  const filtered = selectedArea
    ? areasConAsigs.filter(a => a.id === selectedArea)
    : areasConAsigs

  const niveles = arbol ?? []

  // Obtener los subniveles precisos para una asignatura desde la malla
  const subnivelesDeAsignatura = (asigId: string) => {
    const result: { codigo: string; grados: string[] }[] = []
    const mallas = todasLasMallas.filter((m: any) => m.asignaturaId === asigId)
    for (const nivel of arbol ?? []) {
      for (const sub of nivel.subniveles) {
        const gIds = sub.grados
          .filter((g: any) => mallas.some((m: any) => m.gradoId === g.id))
          .map((g: any) => g.codigo)
        if (gIds.length > 0) {
          result.push({ codigo: sub.codigo, grados: gIds })
        }
      }
    }
    return result
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
          className="rounded border border-input px-3 py-1.5 text-sm">
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>)}
        </select>
        <select value={selectedNivel} onChange={e => setSelectedNivel(e.target.value)}
          className="rounded border border-input px-3 py-1.5 text-sm">
          <option value="">Todos los niveles</option>
          {niveles.map(n => <option key={n.id} value={n.id}>{n.codigo}</option>)}
        </select>
        <span className="text-xs text-muted-foreground self-center">
          {filtered.reduce((s, a) => s + a.asignaturas.length, 0)} asignaturas
          {selectedNivel && ` en ${niveles.find(n => n.id === selectedNivel)?.codigo || ''}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {selectedNivel
              ? 'No hay asignaturas en este nivel educativo'
              : 'No hay asignaturas en esta área'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(area => (
            <div key={area.id} className="rounded-lg border bg-card">
              <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                {areaBadge(area.codigo, area.nombre)}
                <span className="font-medium text-sm">{area.nombre}</span>
                <span className="text-xs text-muted-foreground">({area.asignaturas.length} asignaturas)</span>
              </div>
              <div className="divide-y">
                {area.asignaturas.map((asig: any) => {
                  const subs = subnivelesDeAsignatura(asig.id)
                  return (
                    <div key={asig.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm font-medium">{asig.codigo}</span>
                          <span className="text-sm ml-2">{asig.nombre}</span>
                        </div>
                      </div>
                      {subs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {subs.map(sub => (
                            <span key={sub.codigo}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                              📘 {sub.codigo}
                              <span className="text-[9px] opacity-60">{sub.grados.join(', ')}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB: PARALELOS (integrado con árbol, grado seleccionado + creación)
// ═══════════════════════════════════════════════════════════════
function TabParalelos({ periodos, selectedPeriodo, onPeriodoChange, selectedGradoId, gradosEnArbol, asignaturas, todasLasMallas }: {
  periodos: any[]; selectedPeriodo: string; onPeriodoChange: (id: string) => void
  selectedGradoId: string | null
  gradosEnArbol: any[]; asignaturas: any[]; todasLasMallas: any[]
}) {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [filtroGrado, setFiltroGrado] = useState(selectedGradoId || '')
  const { data, isLoading } = useParalelosPaginadas(selectedPeriodo)
  const paralelos = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  // Form state for new paralelo
  const [showForm, setShowForm] = useState(false)
  const [formAsignaturaId, setFormAsignaturaId] = useState('')
  const [formGradoId, setFormGradoId] = useState(selectedGradoId || '')
  const [formCapacidad, setFormCapacidad] = useState(30)
  const [formError, setFormError] = useState('')

  // Auto-generate código suggestion
  const codigoSugerido = useMemo(() => {
    if (!formGradoId || !formAsignaturaId) return ''
    const grado = gradosEnArbol.find((g: any) => g.id === formGradoId)
    const asig = asignaturas.find((a: any) => a.id === formAsignaturaId)
    if (!grado || !asig) return ''
    return `${grado.codigo}-A-${asig.codigo}`
  }, [formGradoId, formAsignaturaId, gradosEnArbol, asignaturas])

  const crearParaleloMtn = useMutation({
    mutationFn: (data: any) => api.post('/paralelos', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paralelos', selectedPeriodo] })
      setShowForm(false)
      setFormAsignaturaId('')
      setFormGradoId(selectedGradoId || '')
      setFormCapacidad(30)
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.mensaje || err.response?.data?.error || err.message || 'Error al crear paralelo')
    },
  })

  // Asignaturas disponibles para crear paralelo: solo las que están en la malla del grado seleccionado
  const asignaturasDisponibles = useMemo(() => {
    if (!formGradoId || !todasLasMallas || todasLasMallas.length === 0) return asignaturas
    const mallaGradoIds = new Set(
      todasLasMallas.filter((m: any) => m.gradoId === formGradoId).map((m: any) => m.asignaturaId)
    )
    return asignaturas.filter((a: any) => mallaGradoIds.has(a.id))
  }, [formGradoId, todasLasMallas, asignaturas])

  // Si se seleccionó un grado en el árbol, usarlo como filtro
  const gradoFiltro = selectedGradoId || filtroGrado

  // Filtrar por grado en frontend
  const paralelosFiltrados = gradoFiltro
    ? paralelos.filter((s: any) => s.gradoId === gradoFiltro)
    : paralelos

  const nombreAsignatura = (id: string) => {
    const a = asignaturas.find((a: any) => a.id === id)
    return a ? `${a.codigo} — ${a.nombre}` : id.slice(0, 8)
  }

  const handleGradoChange = (val: string) => {
    setFiltroGrado(val)
    setPage(0)
  }

  return (
    <div>
      <div className="mb-4 flex gap-3 items-end">
        <select value={selectedPeriodo} onChange={e => { onPeriodoChange(e.target.value); handleGradoChange('') }}
          className="rounded border border-input px-3 py-1.5 text-sm">
          {periodos.map((p: any) => <option key={p.id} value={p.id}>{p.codigo}</option>)}
        </select>
        <select value={gradoFiltro} onChange={e => handleGradoChange(e.target.value)}
          className="rounded border border-input px-3 py-1.5 text-sm min-w-[140px]">
          <option value="">Todos los grados</option>
          {gradosEnArbol.map((g: any) => (
            <option key={g.id} value={g.id}>{g.codigo} — {g.nombre}</option>
          ))}
        </select>
        {gradoFiltro && (
          <span className="text-xs text-muted-foreground self-center">
            {paralelosFiltrados.length} sección(es)
          </span>
        )}
        <button onClick={() => { setShowForm(!showForm); setFormGradoId(selectedGradoId || '') }}
          className="ml-auto rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
          {showForm ? 'Cancelar' : '+ Nuevo paralelo'}
        </button>
      </div>

      {/* ── Crear paralelo form ── */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          {formError && <InlineError message={formError} />}
          <form onSubmit={e => {
            e.preventDefault()
            if (!formAsignaturaId || !formGradoId) return
            setFormError('')
            crearParaleloMtn.mutate({
              asignaturaId: formAsignaturaId,
              periodoId: selectedPeriodo,
              codigo: codigoSugerido,
              capacidad: formCapacidad,
              gradoId: formGradoId,
              horarios: [],
            })
          }} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Asignatura</label>
              <select value={formAsignaturaId} onChange={e => setFormAsignaturaId(e.target.value)} required
                className="mt-1 block rounded border border-input px-3 py-2 text-sm min-w-[180px]">
                <option value="">Seleccionar...</option>
                {asignaturasDisponibles.length === 0 && formGradoId ? (
                  <option value="" disabled>
                    {todasLasMallas.length === 0 ? 'Cargando mallas...' : 'Este grado no tiene materias en su malla'}
                  </option>
                ) : (
                  asignaturasDisponibles.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Grado</label>
              <select value={formGradoId} onChange={e => setFormGradoId(e.target.value)} required
                className="mt-1 block rounded border border-input px-3 py-2 text-sm min-w-[120px]">
                <option value="">Seleccionar...</option>
                {gradosEnArbol.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.codigo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Código</label>
              <input value={codigoSugerido} readOnly
                className="mt-1 block rounded border border-input bg-gray-50 px-3 py-2 text-sm font-mono min-w-[140px]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Capacidad</label>
              <input type="number" min={1} value={formCapacidad} onChange={e => setFormCapacidad(Number(e.target.value))}
                className="mt-1 block w-20 rounded border border-input px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={crearParaleloMtn.isPending || !formAsignaturaId || !formGradoId}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {crearParaleloMtn.isPending ? 'Creando...' : 'Crear'}
            </button>
          </form>
          {codigoSugerido && (
            <p className="mt-2 text-xs text-muted-foreground">
              Código generado automáticamente: <code className="font-mono bg-muted px-1 rounded">{codigoSugerido}</code>
            </p>
          )}
        </div>
      )}

      {isLoading ? <LoadingSkeleton rows={4} /> : paralelosFiltrados.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {gradoFiltro ? 'No hay paralelos para el grado seleccionado' : 'No hay paralelos en este período'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Código</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Grado</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Asignatura</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Capacidad</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Horario</th>
                </tr>
              </thead>
              <tbody>
                {paralelosFiltrados.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-2 text-sm font-medium">{s.codigo}</td>
                    <td className="px-3 py-2 text-sm">{s.gradoCodigo || '—'}</td>
                    <td className="px-3 py-2 text-sm">{nombreAsignatura(s.asignaturaId)}</td>
                    <td className="px-3 py-2 text-center text-sm">{s.cuposOcupados}/{s.capacidad}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.horarios?.[0]
                        ? `${s.horarios[0].diaSemana} ${(s.horarios[0].horaInicio || '').slice(0,5)}-${(s.horarios[0].horaFin || '').slice(0,5)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!gradoFiltro && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  VISTA MATRIZ (asignaturas × grados) — con datos reales de malla
// ═══════════════════════════════════════════════════════════════
function VistaMatriz({ arbol, asignaturas, areas, todasLasMallas, selectedGradoId, onSelectCell }: {
  arbol: NivelTreeDTO[] | undefined; asignaturas: any[]; areas: any[]; todasLasMallas: any[]
  selectedGradoId: string | null; onSelectCell: (gradoId: string, asigId: string) => void
}) {
  const [selectedNivelMatriz, setSelectedNivelMatriz] = useState<string>('')
  const grados = arbol?.flatMap(n => n.subniveles).flatMap(s => s.grados) ?? []
  const niveles = arbol ?? []

  // Filtro por nivel
  const gradosFiltrados = selectedNivelMatriz
    ? grados.filter(g => {
        const nivel = niveles.find(n => n.subniveles.some(s => s.grados.some(sg => sg.id === g.id)))
        return nivel?.id === selectedNivelMatriz
      })
    : grados

  // Set para lookup rápido: "asignaturaId-gradoId" → exists
  const mallaSet = new Set(todasLasMallas.map((m: any) => `${m.asignaturaId}-${m.gradoId}`))

  // Agrupar asignaturas por área
  const areasConAsigs = areas.map(area => ({
    ...area,
    asignaturas: asignaturas.filter(a => a.areaId === area.id)
  })).filter(a => a.asignaturas.length > 0 && a.asignaturas.some((asig: any) =>
    todasLasMallas.some((m: any) => m.asignaturaId === asig.id)
  ))

  return (
    <div className="overflow-x-auto">
      <div className="mb-3 flex gap-3">
        <select value={selectedNivelMatriz} onChange={e => setSelectedNivelMatriz(e.target.value)}
          className="rounded border border-input px-3 py-1.5 text-sm">
          <option value="">Todos los niveles</option>
          {niveles.map(n => <option key={n.id} value={n.id}>{n.codigo}</option>)}
        </select>
        <span className="text-xs text-muted-foreground self-center">
          {areasConAsigs.reduce((s: number, a: any) => s + a.asignaturas.length, 0)} asignaturas en {todasLasMallas.length} registros de malla
        </span>
      </div>

      <div className="rounded-lg border bg-card" style={{ maxHeight: '60vh', overflow: 'auto' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground min-w-[130px]">Área / Asignatura</th>
              {gradosFiltrados.map(g => (
                <th key={g.id} className={`px-2 py-1.5 text-center font-medium min-w-[48px] ${
                  selectedGradoId === g.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}>
                  <div className="text-[10px]">{g.codigo}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areasConAsigs.flatMap(area => [
              // Fila de área (cabecera de sección)
              <tr key={area.id} className="bg-muted/15" data-area={area.codigo}>
                <td className="px-2 py-1.5 font-semibold flex items-center gap-1 text-xs border-b border-muted/30">
                  <span className={`inline-block w-1.5 h-3 rounded-full ${AREA_COLORS[area.codigo]?.split(' ')[0] || 'bg-gray-400'}`}></span>
                  {areaBadge(area.codigo, null)}
                  <span className="text-foreground">{area.nombre}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">{area.asignaturas.length} asignaturas</span>
                </td>
                {gradosFiltrados.map(g => <td key={g.id} className="border-b border-muted/30"></td>)}
              </tr>,
              // Filas de asignaturas (indentadas bajo el área)
              ...area.asignaturas.map((asig: any) => (
                <tr key={asig.id} className="hover:bg-muted/30 transition-colors">
                  <td className="pl-6 py-1 text-[11px] font-mono text-muted-foreground">
                    <span className="text-[9px] text-gray-300 mr-1">└─</span>
                    {asig.codigo}
                  </td>
                  {gradosFiltrados.map(g => {
                    const incluida = mallaSet.has(`${asig.id}-${g.id}`)
                    const mallaEntry = incluida && todasLasMallas.find((m: any) => m.asignaturaId === asig.id && m.gradoId === g.id)
                    return (
                      <td key={g.id}
                        onClick={() => onSelectCell(g.id, asig.id)}
                        className={`px-2 py-1 text-center text-[10px] cursor-pointer transition-colors ${
                          incluida
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 font-medium'
                            : 'text-gray-200 hover:bg-muted'
                        }`}>
                        {incluida ? (mallaEntry?.horasSemanales || '✓') : '·'}
                      </td>
                    )
                  })}
                </tr>
              ))
            ])}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  INLINE FORMS (Subnivel + Grado)
// ═══════════════════════════════════════════════════════════════
function SubnivelFormInline({ nivelId, onClose }: { nivelId: string; onClose: () => void }) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [orden, setOrden] = useState(1)
  const [error, setError] = useState('')
  const crear = useCrearSubnivel()
  return (
    <div className="rounded border border-primary/30 bg-primary/5 p-3 mt-2">
      {error && <InlineError message={error} />}
      <form onSubmit={e => { e.preventDefault(); setError(''); crear.mutate({ nivelId, codigo: codigo.toUpperCase(), nombre: capitalize(nombre), orden }, { onSuccess: onClose, onError: (err) => setError(errorMsg(err, 'Error')) }) }} className="space-y-2">
        <input value={codigo} onChange={e => setCodigo(e.target.value)} required placeholder="PREP" className="w-full rounded border border-input px-2 py-1 text-xs" />
        <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Preparatoria" className="w-full rounded border border-input px-2 py-1 text-xs" />
        <div className="flex gap-2">
          <input type="number" min={1} value={orden} onChange={e => setOrden(Number(e.target.value))} className="w-14 rounded border border-input px-2 py-1 text-xs" />
          <button type="submit" className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground">Crear</button>
          <button type="button" onClick={onClose} className="text-xs text-muted-foreground">Cancelar</button>
        </div>
      </form>
    </div>
  )
}

function GradoFormInline({ subnivelId, onClose }: { subnivelId: string; onClose: () => void }) {
  const [numero, setNumero] = useState(1)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [edad, setEdad] = useState('')
  const [orden, setOrden] = useState(1)
  const [error, setError] = useState('')
  const crear = useCrearGrado()
  return (
    <div className="rounded border border-primary/30 bg-primary/5 p-3 mt-2">
      {error && <InlineError message={error} />}
      <form onSubmit={e => { e.preventDefault(); setError(''); crear.mutate({ subnivelId, numero, codigo: codigo.toUpperCase(), nombre: capitalize(nombre), edadReferencial: edad || undefined, orden }, { onSuccess: onClose, onError: (err) => setError(errorMsg(err, 'Error')) }) }} className="space-y-2">
        <div className="flex gap-2">
          <input type="number" min={1} value={numero} onChange={e => setNumero(Number(e.target.value))} placeholder="Nro" className="w-12 rounded border border-input px-2 py-1 text-xs" />
          <input value={codigo} onChange={e => setCodigo(e.target.value)} required placeholder="1EGB" className="flex-1 rounded border border-input px-2 py-1 text-xs" />
        </div>
        <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Primero de Educación General Básica" className="w-full rounded border border-input px-2 py-1 text-xs" />
        <div className="flex gap-2">
          <input value={edad} onChange={e => setEdad(e.target.value)} placeholder="5 años" className="flex-1 rounded border border-input px-2 py-1 text-xs" />
          <input type="number" min={1} value={orden} onChange={e => setOrden(Number(e.target.value))} className="w-12 rounded border border-input px-2 py-1 text-xs" />
          <button type="submit" className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground">Crear</button>
          <button type="button" onClick={onClose} className="text-xs text-muted-foreground">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
