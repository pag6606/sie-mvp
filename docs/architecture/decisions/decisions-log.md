# Design Decisions Log

## Step 01 — Init
- Project: sis-mvp (Sistema de Información Estudiantil)
- Type: Digital product (web application)
- Brief level: Complete
- Tech stack confirmed: Spring Boot, React + Tailwind + shadcn/ui, hexagonal + CQRS, RabbitMQ, PostgreSQL
- Style: Minimalista, funcional, priorizando claridad

## Step 01a — Client Profile
- Organisation: Colegio privado, ~500 estudiantes, SME educativo
- Key people: Paul (arquitecto de soluciones, consultor externo), Adrián (líder de proyecto)
- Decision culture: Committee — junta de accionistas decide en grupo
- Internal driver: Reemplazar SIS actual con mala UX e inflexible; necesitan producto que supla demanda operativa y sea extensible
- Tech maturity: Tienen SIS actual (experiencia digital previa), con personal de tecnología y negocio como contraparte
- Design maturity: Saben lo que no quieren por experiencia con el sistema actual

## Step 03 — Positioning
- Target: Colegios privados ecuatorianos, foco MVP en administrativos
- Need: Sistema funcional sin fricción, adaptable
- Category: SIS modular y evolutivo
- Benefit: Se adapta a las personas, evoluciona con la institución
- Alternatives: Runachay (deuda técnica, mala UX), Idukay (SaaS cerrado, no extensible)
- Differentiator: Arquitectura diseñada para ajustarse y evolucionar desde dolores reales de usuarios

### Product Brief Synthesis (Step 12)
- Final narrative presented and confirmed
- User confirmed: "lo damos por cerrado"
- Brief location: `_bmad-output/A-Product-Brief/project-brief.md`
- Completion: 2026-06-02
