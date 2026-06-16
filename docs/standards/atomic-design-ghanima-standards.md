---
title: "Atomic Design Standards — Ghanima Design System"
author: "Winston — System Architect"
date: "2026-06-13"
version: "1.0.0"
status: "Active"
scope: "frontend/src/"
---

# Estándares Arquitectónicos de Atomic Design para Ghanima

Este documento define las reglas de clasificación, estructura y API
de componentes para implementar el design system **Ghanima**
en el frontend SIE usando la metodología Atomic Design.

---

## 1. Reglas de Clasificación por Nivel Atómico

Cada componente nuevo DEBE clasificarse exactamente en uno de los
siguientes cinco niveles. La clasificación determina su ubicación
en el filesystem, sus reglas de dependencia y su contrato de props.

### 1.1 Átomo (`components/ui/ghanima/`)

Un átomo es la unidad más pequeña del design system. No tiene
dependencias de otros componentes del proyecto.

**Características obligatorias:**
- Renderiza un solo elemento DOM o una composición trivial
  (etiqueta + input).
- Es 100% stateless — solo props, cero estado interno.
- No conoce el dominio de negocio.
- No importa otros componentes Ghanima (sí puede importar
  utilidades como `cn` o iconos).

**Ejemplos de átomos en Ghanima:**
- `Button` → `<button>` con variantes (`primary`, `secondary`,
  `ghost`, `destructive`) y tamaños (`sm`, `md`, `lg`).
- `Input` → `<input>` con label, error, icono izquierdo/derecho.
- `Badge` → `<span>` para etiquetas de estado.
- `Icon` → wrapper tipado sobre íconos (emoji o SVG inline).
- `Spinner` → indicador de carga animado.
- `Avatar` → `<div>` con iniciales o imagen.
- `Separator` → `<hr />` estilizado.
- `Label` → `<label>` estilizado.
- `Select` → `<select>` nativo estilizado.
- `Textarea` → `<textarea>` estilizado.
- `Checkbox` → `<input type="checkbox">` estilizado.
- `RadioGroup` → grupo de radio buttons.
- `Skeleton` → placeholder animado.
- `TooltipTrigger` → wrapper que abre tooltip.
- `Link` → `<a>` o `<Link>` de react-router estilizado.

**Qué NO es un átomo:**
- Un campo de formulario con label + input + mensaje de error
  juntos (eso es un `Field`, que es molécula).
- Un badge que decide su color según el valor de negocio
  (eso es molécula u organismo).

### 1.2 Molécula (`components/ui/molecules/`)

Una molécula compone 2+ átomos para cumplir una responsabilidad
única y bien definida. Puede tener estado interno ligero.

**Características obligatorias:**
- Usa al menos 2 átomos de `ghanima/`.
- Tiene una sola responsabilidad clara.
- No accede a APIs ni hooks de datos (ej. `useQuery`).
- Puede tener estado UI local (ej. `isOpen`, `isFocused`).
- Acepta `className` para composición externa.

**Ejemplos de moléculas en Ghanima:**
- `Field` → `Label` + `Input`/`Select`/`Textarea` + mensaje de
  error. Una sola unidad de campo de formulario.
- `Notice` → `Icon` + mensaje + opción de cierre. Notificación
  inline (éxito, error, advertencia, info).
- `Kpi` → label + valor + ícono de tendencia. Indicador
  numérico de dashboard.
- `Callout` → `Icon` + título + descripción. Bloque informativo
  destacado (hereda de UIPatterns actuales).
- `Pagination` → compone botones de navegación (ya existe,
  migrar a molécula con átomos `Button`).
- `SearchBar` → `Input` con ícono de búsqueda + acción.
- `ConfirmModal` → overlay con título, mensaje y botones
  de acción (ya existe en UIPatterns, migrar a molécula).
- `Toast` → notificación flotante temporal (ya existe como
  provider, mantener patrón pero migrar estilos).
- `ProgressBar` → indicador de pasos (ya existe, migrar).
- `FileUpload` → `Input[type=file]` + dropzone + preview.

**Qué NO es una molécula:**
- Un formulario completo de login (es un organismo).
- Una tarjeta con header, cuerpo y footer (es un organismo).

### 1.3 Organismo (`components/ui/organisms/`)

Un organismo es una paralelo compleja de UI que compone moléculas
y átomos. Conoce el dominio de negocio y puede consumir hooks
de datos.

**Características obligatorias:**
- Compone moléculas + átomos.
- Puede consumir hooks de negocio (`useQuery`, contexto).
- Representa una paralelo funcional completa de una página.
- Puede tener estado interno significativo.
- Prop `className` para ajustes de layout del padre.

**Ejemplos de organismos en Ghanima:**
- `AuthFrame` → layout de autenticación (hero panel +
  formulario de login). Reemplaza el JSX inline actual
  de `LoginPage`.
- `SectionCard` → `Card` (átomo o molécula) con header, cuerpo
  colapsable, footer y acciones. Usado en dashboards y páginas
  de detalle.
- `DataTable` → tabla con búsqueda, ordenamiento, paginación,
  selección múltiple y exportación. (Ya existe como componente
  plano, migrar a organismo usando moléculas y átomos.)
- `DetailPanel` → panel lateral con información de detalle.
  (Ya existe, migrar a organismo.)
- `CsvUploader` → uploader de archivos CSV con validación.
  (Ya existe, migrar a organismo.)
- `ImportarStepper` → wizard multi-paso para importación.
  (Ya existe, migrar a organismo.)
- `RiskGauge` → medidor visual de riesgo académico con
  semáforo. (Ya existe, migrar a organismo.)
- `AppLayout` → sidebar + header móvil + contenido principal.
  (Ya existe en `components/AppLayout.tsx`, migrar a organismo.)
- `Navbar` → barra de navegación superior o lateral.
  (Ya existe, migrar a organismo.)
- `CsvPreviewTable` → tabla de previsualización de datos CSV.
  (Ya existe, migrar a organismo.)

**Qué NO es un organismo:**
- Una página completa (es un `Page`).
- Una utility o hook (va en `hooks/`).

### 1.4 Template (`components/templates/`)

Un template define la estructura de layout de un tipo de página.
Provee slots (vía `children` o render props) para que las páginas
inyecten organismos.

**Características obligatorias:**
- Define exclusivamente layout/grid/layout.
- No contiene lógica de negocio.
- Solo compone organismos y otros templates vía `children`.
- Acepta props de configuración de layout.

**Ejemplos de templates en Ghanima:**
- `AppShell` → layout maestro con sidebar + header + contenido.
  Envuelve `AppLayout` y provee slots para breadcrumbs y
  acciones de página.
- `PageHead` → encabezado de página con título, descripción,
  breadcrumbs y slot para acciones.
- `FormGrid` → grid de 1 o 2 columnas para formularios,
  con slots para paralelos y sticky footer con acciones.
- `ContentLayout` → layout genérico con área de filtros +
  contenido principal + panel lateral opcional.

### 1.5 Page (`pages/`)

Una página es una instancia concreta que compone templates
con organismos específicos. Representa una ruta de la aplicación.

**Reglas:**
- Las páginas NO crean layout desde cero — usan templates.
- Las páginas NO definen estilos inline ni clases Tailwind
  de layout — delegan en templates y organismos.
- Las páginas SÍ contienen lógica de navegación y composición
  de datos para sus organismos hijos.
- Se mantienen en la estructura existente:
  `pages/{admin,docente,estudiante,auth}/`.

**Ejemplo de página bien formada:**
```tsx
export default function LoginPage() {
  return (
    <AuthFrame
      title="Bienvenido de vuelta"
      subtitle="Ingresa tus credenciales para continuar"
    >
      {/* organismos o moléculas aquí */}
    </AuthFrame>
  )
}
```

### 1.6 Diagrama de Dependencias

```
Page ─────────────► Template ────────────► Organism ────────► Molecule ────────► Atom
 │                     │                      │                  │                 │
 └── puede saltar ────►│──────────────────────►│──────────────────►│─────────────────►│
   niveles si es       │                      │                  │                 │
   necesario           │                      │                  │                 │
                       │                      │                  │                 │
 NO permitido: Atom ──► Molecule ──► Organism ──► Template (dependencia inversa)
```

**Regla de dependencia:**
Un nivel inferior NUNCA importa un nivel superior.
`Button` (átomo) no puede importar `Field` (molécula).
`Field` (molécula) no puede importar `SectionCard` (organismo).

---

## 2. Estructura de Archivos y Directorios

### 2.1 Estructura Objetivo

```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── ghanima/                    ← Átomos del design system
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── Separator.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Link.tsx
│   │   │   └── index.ts               ← barrel file
│   │   │
│   │   ├── molecules/                  ← Moléculas
│   │   │   ├── Field.tsx
│   │   │   ├── Notice.tsx
│   │   │   ├── Kpi.tsx
│   │   │   ├── Callout.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── organisms/                  ← Organismos
│   │       ├── AuthFrame.tsx
│   │       ├── SectionCard.tsx
│   │       ├── DataTable.tsx
│   │       ├── DetailPanel.tsx
│   │       ├── CsvUploader.tsx
│   │       ├── ImportarStepper.tsx
│   │       ├── CsvPreviewTable.tsx
│   │       ├── RiskGauge.tsx
│   │       ├── RiskBadge.tsx
│   │       ├── AppLayout.tsx
│   │       ├── Navbar.tsx
│   │       └── index.ts
│   │
│   ├── templates/                      ← Templates (layout)
│   │   ├── AppShell.tsx
│   │   ├── PageHead.tsx
│   │   ├── FormGrid.tsx
│   │   └── ContentLayout.tsx
│   │
│   ├── LoadingSkeleton.tsx             ← DEPRECADO → usar ghanima/Skeleton
│   ├── InlineError.tsx                 ← DEPRECADO → usar molecules/Notice
│   ├── EmptyState.tsx                  ← DEPRECADO → usar molecules/Callout
│   │
│   └── __tests__/                      ← tests específicos de componentes
│       ├── ui/ghanima/
│       ├── ui/molecules/
│       ├── ui/organisms/
│       └── templates/
│
├── pages/                              ← Sin cambios estructurales
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── ActivatePage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── PasswordResetPage.tsx
│   ├── admin/
│   │   └── ...
│   ├── docente/
│   │   └── ...
│   └── estudiante/
│       └── ...
│
├── hooks/                              ← Sin cambios
├── services/                           ← Sin cambios
├── types/                              ← Sin cambios
├── utils/                              ← Sin cambios
├── lib/
│   └── utils.ts                        ← cn() helper
│
├── styles/
│   ├── ghanima.css                     ← Tokens CSS de Ghanima
│   └── tailwind.config.ts              ← Extendido con tokens Ghanima
│
├── App.tsx                             ← Sin cambios
├── main.tsx                            ← Sin cambios
└── index.css                           ← Reemplazado por ghanima.css (deprecar)
```

### 2.2 Reglas del Barrel File (`index.ts`)

Cada nivel DEBE tener un `index.ts` que re-exporte todos los
componentes de ese nivel. Los imports desde fuera del nivel
DEBEN usar el barrel, no el archivo individual.

```ts
// components/ui/ghanima/index.ts
export { Button } from './Button'
export { Input } from './Input'
export { Badge } from './Badge'
// ... etc.
```

```ts
// Uso correcto (fuera del nivel)
import { Button, Input } from '@/components/ui/ghanima'

// Uso correcto (dentro del mismo nivel)
import { Badge } from './Badge'
import { Icon } from './Icon'
```

### 2.3 Organización de Tests

Los tests de componentes Ghanima viven en `__tests__/` replicando
la estructura del source:

```
frontend/src/components/__tests__/
├── ui/
│   ├── ghanima/
│   │   ├── Button.test.tsx
│   │   └── Input.test.tsx
│   ├── molecules/
│   │   ├── Field.test.tsx
│   │   └── Notice.test.tsx
│   └── organisms/
│       ├── DataTable.test.tsx
│       └── AuthFrame.test.tsx
└── templates/
    ├── AppShell.test.tsx
    └── FormGrid.test.tsx
```

---

## 3. API de Componentes — Contrato Estándar

### 3.1 Reglas Obligatorias para Todo Componente Ghanima

#### 3.1.1 Props Interface

```ts
// ✅ Correcto
interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

// ❌ Incorrecto
// - No usar type en lugar de interface para props de componente
// - No omitir className
// - No usar nombres que no sigan el patrón {Componente}Props
```

**Reglas:**
1. Toda prop interface se nombra **`{ComponentName}Props`**.
2. Todo componente DEBE aceptar **`className?: string`** para
   permitir composición externa. Esta clase se aplica al elemento
   raíz del componente mediante `cn()`.
3. No usar `type` para props de componentes exportados.
4. No extender `HTMLAttributes` genérico directamente —
   exponer solo las props que el componente necesita.

#### 3.1.2 Exportación

```ts
// ✅ Correcto: named + default
export interface ButtonProps { /* ... */ }
export function Button({ children, variant = 'primary', size = 'md', className }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)}>{children}</button>
}
export default Button

// ✅ También válido para SFC simples
export default function Badge({ children, variant = 'default', className }: BadgeProps) { ... }
```

Todo componente debe:
1. Exportar su interfaz de props como named export.
2. Exportar el componente como named export.
3. Exportar el componente como default export.

#### 3.1.3 forwardRef

Todo componente que envuelve un elemento nativo interactivo
(`<button>`, `<input>`, `<select>`, `<textarea>`) DEBE usar
`forwardRef`.

```ts
import { forwardRef } from 'react'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, variant = 'primary', size = 'md', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
```

**Componentes que DEBEN usar forwardRef:**
- `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`

**Componentes que NO necesitan forwardRef:**
- `Badge`, `Spinner`, `Icon`, `Separator`, `Skeleton`, `Notice`,
  `Kpi`, `Callout`, `Field` (compone, no es elemento nativo)

#### 3.1.4 JSDoc

Todo componente DEBE tener un bloque JSDoc con descripción
y al menos un `@example`.

```ts
/**
 * Botón primario del sistema con soporte para variantes de color y tamaño.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={handleSubmit}>
 *   Guardar cambios
 * </Button>
 *
 * @example
 * <Button variant="ghost" size="sm" disabled>
 *   Acción no disponible
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(/* ... */)
```

#### 3.1.5 Composición con `cn()`

Todos los componentes DEBEN usar `cn()` (de `@/lib/utils`)
para combinar clases base con `className` recibido. La clase
recibida se aplica SIEMPRE al elemento raíz del componente.

```ts
// ✅ Correcto
<div className={cn('flex items-center gap-2', className)}>

// ❌ Incorrecto — className no se aplica
<div className="flex items-center gap-2">

// ❌ Incorrecto — orden incorrecto (className antes)
<div className={cn(className, 'flex items-center gap-2')}>
// El orden debe ser: clases base primero, className al final
// para que tailwind-merge dé prioridad a las sobreescrituras
```

**Regla de orden en `cn()`:**
1. Clases base del componente.
2. Clases condicionales internas.
3. `className` recibido por props (siempre al final).

#### 3.1.6 Componentes Sin Estado vs Con Estado

| Nivel | ¿Estado interno? | ¿Hooks de datos? |
|-------|-----------------|-----------------|
| Átomo | No | No |
| Molécula | Solo estado UI local | No |
| Organismo | Sí (estado de paralelo) | Sí (`useQuery`, hook store) |
| Template | Solo estado de layout | No |
| Page | Sí | Sí |

---

## 4. Estrategia de Migración

### 4.1 Principio de Coexistencia

**Ghanima y el código existente conviven durante toda la
migración.** No hay big-bang. Cada página se migra una a la vez.

```
Fase 0 (setup):
  ├── Crear ghanima.css con tokens
  ├── Extender tailwind.config con tokens Ghanima
  ├── Construir átomos (Button, Input, Badge, Icon, etc.)
  └── Los componentes existentes siguen funcionando sin cambios

Fase 1+: Una página a la vez
  ├── Construir moléculas/organismos necesarios
  ├── Migrar página (reemplazar clases Tailwind inline por
  │   componentes Ghanima)
  ├── Verificar que tests pasan
  └── Marcar componentes planos reemplazados como @deprecated
```

### 4.2 Marcado de Deprecación

Los componentes planos actuales que sean reemplazados por
equivalentes Ghanima se marcan con `@deprecated` en JSDoc,
indicando el reemplazo:

```ts
/**
 * @deprecated Usar `@/components/ui/ghanima/Button` en su lugar.
 * Este componente será eliminado en la versión 2.0.
 */
export default function OldButton(props: OldButtonProps) { ... }
```

### 4.3 Orden de Migración

El orden de migración de páginas es:

1. **Login** (`pages/auth/LoginPage.tsx`) — página más aislada,
   no comparte layout con el resto. Permite validar `AuthFrame`
   y átomos básicos (Button, Input, Field, Notice).
2. **Páginas de auth restantes** — Activate, Reset, Privacy.
3. **Dashboard Admin** — la página más compleja, Forza la
   creación de `DataTable`, `SectionCard`, `Kpi`.
4. **Páginas Admin restantes** — Usuarios, Asignaturas, Paralelos,
   Matrícula, etc.
5. **Páginas Docente** — Asistencia, Notas, Cierre, Esquema.
6. **Páginas Estudiante** — Dashboard, Boletín.

### 4.4 Seguridad de Regresión

Cada página migrada debe cumplir:

1. **Tests existentes pasan sin modificación** — si un test
   necesita cambios, la migración está mal hecha.
2. **Mismos selectores `data-testid`** si existen, para no
   romper tests E2E.
3. **Misma estructura de accesibilidad** (roles ARIA, labels).
4. **Misma funcionalidad** — no se agregan ni quitan features
   durante la migración.

### 4.5 Convención de Commits para Migración

```
feat(ghanima): add Button and Input atoms
feat(ghanima): add AuthFrame organism
refactor(auth): migrate LoginPage to Ghanima components
deprecate: mark InlineError as deprecated, replaced by molecules/Notice
```

---

## 5. Qué hacer con Tailwind y clases utilitarias existentes

### 5.1 Tailwind se Mantiene Como Motor de Estilos

**Ghanima NO reemplaza Tailwind — lo extiende.** Los componentes
Ghanima usan clases Tailwind internamente. Las páginas migradas
dejan de usar clases Tailwind inline (porque delegan en
componentes Ghanima), pero Tailwind sigue disponible para
ajustes de layout o casos no cubiertos.

### 5.2 Clasificación de Clases Actuales

| Tipo de clase actual | Destino en Ghanima |
|---------------------|-------------------|
| `rounded-lg border bg-card px-4 py-2 text-sm` → botón | `ghanima/Button` |
| `block w-full rounded-lg border ...` → input | `ghanima/Input` |
| `text-2xl font-bold text-foreground` → heading | `templates/PageHead` |
| `flex h-screen overflow-hidden bg-background` → layout | `organisms/AppLayout` |
| `inline-flex items-center gap-1.5 rounded-full ...` → badge | `ghanima/Badge` |
| Gradientes inline (`style={{ background: ... }}`) | `ganima.css` token `--ghanima-gradient-brand` |
| `animate-pulse space-y-3` → skeleton | `ghanima/Skeleton` |

### 5.3 Layouts Existentes

El sistema actual usa Tailwind para layouts (flex, grid, spacing).
En Ghanima, los templates y organismos encapsulan estos layouts:

- `AppLayout.tsx` → `organisms/AppLayout.tsx` + `templates/AppShell.tsx`
- `LoginPage` (layout inline del hero panel + formulario) →
  `organisms/AuthFrame.tsx`
- `Navbar.tsx` → unificado dentro de `AppLayout`
- Espaciado de páginas (margin, padding, gap) → definido por
  el template que las envuelve.

---

## 6. Tokens de Diseño

### 6.1 Archivo `styles/ghanima.css`

```css
:root {
  /* === Ghanima Design Tokens === */

  /* Brand */
  --ghanima-brand-50: #eef2ff;
  --ghanima-brand-100: #e0e7ff;
  --ghanima-brand-200: #c7d2fe;
  --ghanima-brand-300: #a5b4fc;
  --ghanima-brand-400: #818cf8;
  --ghanima-brand-500: #6366f1;   /* ← indigo-500 = primary actual */
  --ghanima-brand-600: #4f46e5;   /* ← indigo-600 */
  --ghanima-brand-700: #4338ca;
  --ghanima-brand-800: #3730a3;
  --ghanima-brand-900: #312e81;

  /* Gradient (hero panel) */
  --ghanima-gradient-brand: linear-gradient(
    135deg,
    var(--ghanima-brand-600) 0%,
    var(--ghanima-brand-800) 50%,
    var(--ghanima-brand-900) 100%
  );

  /* Spacing scale (4px base) */
  --ghanima-space-1: 0.25rem;
  --ghanima-space-2: 0.5rem;
  --ghanima-space-3: 0.75rem;
  --ghanima-space-4: 1rem;
  --ghanima-space-6: 1.5rem;
  --ghanima-space-8: 2rem;
  --ghanima-space-12: 3rem;

  /* Border radius */
  --ghanima-radius-sm: 0.375rem;
  --ghanima-radius-md: 0.5rem;
  --ghanima-radius-lg: 0.75rem;
  --ghanima-radius-xl: 1rem;
  --ghanima-radius-full: 9999px;

  /* Shadows */
  --ghanima-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ghanima-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --ghanima-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### 6.2 Extensión de Tailwind

```js
// tailwind.config.js (extensión)
export default {
  theme: {
    extend: {
      colors: {
        // ... colores actuales se mantienen
        ghanima: {
          brand: {
            50: 'var(--ghanima-brand-50)',
            100: 'var(--ghanima-brand-100)',
            // ...
            500: 'var(--ghanima-brand-500)',
            900: 'var(--ghanima-brand-900)',
          },
        },
      },
      spacing: {
        'ghanima-1': 'var(--ghanima-space-1)',
        // ...
      },
    },
  },
}
```

### 6.3 Consistencia con Design Tokens Actuales

Los tokens CSS custom properties actuales en `index.css`
(`--background`, `--foreground`, `--primary`, etc.) se CONSERVAN.
Los tokens Ghanima son una capa adicional encima, no un reemplazo.
Los tokens shadcn-style existentes alimentan las utilidades Tailwind
`bg-card`, `text-foreground`, etc. Los tokens Ghanima alimentan
valores específicos del design system.

---

## 7. Checklist de Validación para Componentes Nuevos

Antes de dar por terminado cualquier componente Ghanima, verificar:

- [ ] ¿Está en el nivel atómico correcto?
- [ ] ¿La interfaz de props se llama `{ComponentName}Props`?
- [ ] ¿Acepta `className?: string` y lo aplica vía `cn()` al
  elemento raíz?
- [ ] ¿Usa `forwardRef` si envuelve un elemento nativo
  interactivo?
- [ ] ¿Tiene JSDoc con descripción y al menos un `@example`?
- [ ] ¿Exporta interfaz de props (named), componente (named) y
  componente (default)?
- [ ] ¿Está registrado en el `index.ts` barrel de su nivel?
- [ ] ¿Tiene test unitario en `__tests__/ui/{nivel}/`?
- [ ] ¿No importa componentes de un nivel superior?
- [ ] ¿Usa `cn()` con las clases base primero y `className`
  al final?
- [ ] Si reemplaza un componente existente, ¿el componente
  original se marcó como `@deprecated`?

---

## 8. Gobernanza

### 8.1 ¿Quién decide la clasificación?

El arquitecto (Winston) es responsable de validar la clasificación
de componentes. En caso de duda sobre si un componente es molécula
u organismo, el criterio es:

> Si consume hooks de datos de negocio → **organismo**.
> Si solo compone átomos con estado UI local → **molécula**.

### 8.2 ¿Quién aprueba nuevos átomos?

Cualquier desarrollador puede proponer un nuevo átomo, pero debe
ser aprobado por el arquitecto antes de merge. El criterio es:

> ¿Este componente será usado en al menos 3 lugares distintos?
> Si la respuesta es no, probablemente no merece ser un átomo
> del design system y debería ser un componente local de la
> página u organismo que lo necesita.

### 8.3 Evolución de este documento

Este documento sigue el mismo proceso de ADR que el resto de
decisiones arquitectónicas. Cambios requieren:

1. Propuesta en el canal de arquitectura.
2. Aprobación del arquitecto.
3. Actualización de este documento con el nuevo `date` y
   `version` en el frontmatter.
