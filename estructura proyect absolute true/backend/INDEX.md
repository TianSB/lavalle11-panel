# Backend — Documentación

> Este directorio contiene toda la documentación técnica del backend.

| Archivo | Propósito | Estado |
|---|---|---|
| [INDEX.md](./INDEX.md) | Este archivo | ✅ |
| [webhook.md](./webhook.md) | Especificación del webhook de Callbell | 🟡 Por completar |
| [api-endpoints.md](./api-endpoints.md) | Todos los endpoints de la API REST | 🟡 Por completar |
| [claude-integration.md](./claude-integration.md) | Integración con Claude API | 🟡 Por completar |
| [callbell-integration.md](./callbell-integration.md) | Integración con Callbell API | 🟡 Por completar |
| [google-sheets-sync.md](./google-sheets-sync.md) | Sincronización con Google Sheets | 🟡 Por completar |

## Stack

- **Runtime:** Node.js 20 LTS (Vercel Serverless Functions)
- **API:** Vercel Functions (Express o Next.js API Routes)
- **SDKs:** `@anthropic-ai/sdk`, `@supabase/supabase-js`
- **Formato:** TypeScript estricto

## Arquitectura de Archivos (Backend)

```
src/
├── api/
│   └── callbell/
│       └── webhook.ts          # POST /api/callbell/webhook
│   └── casos/
│       ├── index.ts            # GET /api/casos
│       └── [id].ts             # GET/PATCH /api/casos/:id
│   └── metricas/
│       └── index.ts            # GET /api/metricas (admin)
├── services/
│   ├── claude.service.ts       # Lógica de análisis con Claude
│   ├── callbell.service.ts     # Llamadas a Callbell API
│   ├── sheets.service.ts       # Lectura de Google Sheets
│   └── casos.service.ts        # Lógica de negocio de casos
├── lib/
│   ├── supabase.ts             # Cliente de Supabase
│   ├── validation.ts           # Validación de webhooks
│   └── types.ts                # Tipos compartidos
└── config/
    └── env.ts                  # Variables de entorno tipadas
```

## Variables de Entorno

```env
# Vercel
ANTHROPIC_API_KEY=
CALLBELL_API_KEY=
CALLBELL_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SHEETS_API_KEY=
GOOGLE_SHEETS_ID=
```
