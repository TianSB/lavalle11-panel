# Frontend — Documentación

> Este directorio contiene toda la documentación técnica del frontend.

| Archivo | Propósito | Estado |
|---|---|---|
| [INDEX.md](./INDEX.md) | Este archivo | ✅ |
| [component-tree.md](./component-tree.md) | Árbol de componentes | 🟡 Por completar |
| [views.md](./views.md) | Definición de vistas | 🟡 Por completar |
| [data-flow.md](./data-flow.md) | Flujo de datos en el panel | 🟡 Por completar |

## Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Estilos:** Tailwind CSS v4
- **Estado:** React Context + hooks locales
- **Realtime:** Supabase Realtime (SDK `@supabase/supabase-js`)
- **Auth:** Supabase Auth
- **Hosting:** Vercel

## Estructura de Archivos (Frontend)

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── StatusBar.tsx
│   ├── cases/
│   │   ├── CaseCard.tsx
│   │   ├── CaseGrid.tsx
│   │   ├── CaseModal.tsx
│   │   ├── FilterBar.tsx
│   │   └── ExtractionSummary.tsx
│   ├── shared/
│   │   ├── ImageViewer.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── InstructionsChecklist.tsx
│   │   ├── MessagePreview.tsx
│   │   ├── CallButton.tsx
│   │   └── InternalNote.tsx
│   └── metrics/
│       └── MetricsBoard.tsx
├── views/
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── context/
│   ├── AuthContext.tsx
│   └── CasesContext.tsx
├── hooks/
│   ├── useRealtimeCases.ts
│   └── useAuth.ts
├── lib/
│   └── supabase.ts
├── types/
│   └── index.ts
└── data/
    └── mockCases.ts           # Solo Fase 1
```

## Principios de UI

- **Responsive:** 3 columnas desktop, 2 tablet, 1 mobile
- **Tema claro/oscuro:** Por definir (inicialmente solo claro)
- **Prioridad visual:** Rojo > Naranja > Verde para cards
- **Micro-interacciones:** Hover, transiciones suaves en cards
- **Sin dependencias UI pesadas:** Solo Tailwind + componentes custom
