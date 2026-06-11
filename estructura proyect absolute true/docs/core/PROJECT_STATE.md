# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Documento maestro de estado del proyecto.
> **Última actualización:** 2026-06-09
> **Versión:** 1.0 — Basado en PRD v1.0 Draft

---

## 1. Identidad del Proyecto

| Campo | Valor |
|---|---|
| Nombre del sistema | Panel de Gestión de Turnos con IA |
| Propósito | Capa inteligente entre Callbell CRM y asesores humanos para gestionar turnos de diagnóstico por imágenes |
| Cliente | Instituto Lavalle 11 / Gamma Laboratorios |
| Ubicación | Bahía Blanca, Argentina — 2 sedes: Lavalle 11 (general) y Chiclana 385 (Medicina Nuclear) |
| Autor PRD | RIA · r-ia.vercel.app |
| Fecha PRD | Junio 2026 |
| Stack | React + Vite + Tailwind / Node.js Serverless / Supabase / Claude API / Callbell API |

---

## 2. Fase Actual

| Fase | Estado | Progreso |
|---|---|---|
| **Fase 0 — Definición y documentación** | ✅ Completada | 100% |
| **Fase 1 — Panel estático (validación visual)** | ⬜ Pendiente | 0% |
| Fase 2 — Backend y webhook de Callbell | ⬜ Pendiente | 0% |
| Fase 3 — Análisis con Claude IA | ⬜ Pendiente | 0% |
| Fase 4 — Acciones del asesor (flujo completo) | ⬜ Pendiente | 0% |
| Fase 5 — Seguimiento y métricas | ⬜ Pendiente | 0% |

**Siguiente paso:** Inicializar proyecto React + Vite + Tailwind y comenzar Fase 1.

---

## 3. Resumen Ejecutivo

El Instituto Lavalle 11 recibe **40–80 mensajes por día** por WhatsApp para gestionar turnos de diagnóstico por imágenes. Actualmente:

- El flujo opera 100% manual sobre Callbell CRM
- **4 asesores registrados**, solo **~1.5 FTE** operativos frente a pantalla
- Cada caso requiere leer el chat completo, interpretar la orden médica, identificar obra social, evaluar copago, redactar respuesta y registrar en el RIS
- El bot actual **no reconoce adjuntos ni texto libre** (100% de los casos analizados)
- **Sin memoria entre sesiones** — el bot trata cada contacto como nuevo
- Llamadas desde **celulares personales** sin registro
- **Casos caídos** sin seguimiento (el peor caso: 3 contactos del mismo número en 9 meses sin resolución)

El sistema propuesto:

1. **Analiza automáticamente** cada conversación entrante de Callbell — texto e imágenes — y extrae información estructurada usando Claude API
2. **Presenta cada caso** como una card en un panel web con toda la información procesada
3. **Ejecuta las acciones** del asesor — confirmar turno, enviar mensaje, registrar llamada, derivar — enviando las respuestas de vuelta a WhatsApp

---

## 4. Stack Tecnológico Confirmado

| Componente | Tecnología | Versión | Estado |
|---|---|---|---|
| Frontend | React + Vite + Tailwind CSS | React 19 | Pendiente de inicializar |
| Lenguaje | **TypeScript estricto** — frontend y backend | — | Confirmado por el usuario |
| Backend | Node.js (Vercel Serverless Functions) | 20 LTS | Pendiente de inicializar |
| Base de datos | Supabase (PostgreSQL + REST + Realtime + Auth) | — | Pendiente de configurar |
| IA | Claude API (Anthropic) | claude-sonnet-4-20250514 | Pendiente de integrar |
| CRM | Callbell API (Webhooks + Messages API) | — | Pendiente de integrar |
| Config remota | Google Sheets API | v4 | Pendiente de integrar |
| Llamadas de voz | WhatsApp Desktop via wa.me/ | — | Fuera del sistema |
| Repositorio | GitHub | — | Pendiente de crear |
| Hosting | Vercel (Pro) | — | Pendiente de configurar |

---

## 5. Estructura del Proyecto

```
/
├── PRD_Lavalle11_v1.docx       # PRD original (fuente de verdad)
├── README.md                   # Portal de entrada
├── docs/
│   ├── core/
│   │   ├── PROJECT_STATE.md    # ← Este archivo
│   │   ├── ARCHITECTURE.md     # Arquitectura del sistema
│   │   ├── DECISIONS.md        # Decisiones técnicas (ADRs)
│   │   ├── TODO.md             # Plan de trabajo
│   │   └── SESSION_LOG.md      # Registro de sesiones
│   ├── glossary.md             # Glosario de términos
│   ├── risks.md                # Matriz de riesgos
│   └── workflow.md             # Flujo de trabajo con IA
│   ├── core/                   # PRD, requisitos, casos de uso, reglas
│   ├── decisions/              # ADRs individuales
│   ├── planning/               # Roadmap y planes de fase
│   ├── backend/                # Documentación del backend
│   ├── frontend/               # Documentación del frontend
│   ├── database/               # Esquema y políticas de base de datos
│   └── prompts/                # Prompts del sistema
```

---

## 6. Documentación Disponible

| Archivo | Propósito | Estado |
|---|---|---|
| `PRD_Lavalle11_v1.docx` | PRD original | ✅ Completo |
| `docs/core/PROJECT_STATE.md` | Estado actual del proyecto | ✅ Completo |
| `docs/core/ARCHITECTURE.md` | Arquitectura detallada | ✅ Completo |
| `docs/core/DECISIONS.md` | Decisiones técnicas (ADRs) | ✅ Completo |
| `docs/core/TODO.md` | Plan de trabajo y seguimiento | ✅ Completo |
| `docs/core/SESSION_LOG.md` | Registro de sesiones | ✅ Completo |
| `docs/glossary.md` | Glosario de términos | ✅ Completo |
| `docs/risks.md` | Matriz de riesgos | ✅ Completo |
| `docs/workflow.md` | Flujo de trabajo con IA | ✅ Completo |
| `core/PRD.md` | PRD en Markdown | ✅ Completo |
| `core/requirements.md` | Requerimientos funcionales y no funcionales | ✅ Completo |
| `core/use-cases.md` | Casos de uso detallados | ✅ Completo |
| `core/business-rules.md` | Reglas de negocio | ✅ Completo |
| `decisions/template.md` | Plantilla para nuevos ADRs | ✅ Completo |
| `planning/roadmap.md` | Roadmap de desarrollo | ✅ Completo |
| `planning/phase-1-panel-estatico.md` | Plan detallado de Fase 1 | ✅ Completo |
| `backend/INDEX.md` | Documentación del backend | 🟡 Esqueleto |
| `frontend/INDEX.md` | Documentación del frontend | 🟡 Esqueleto |
| `database/INDEX.md` | Documentación de base de datos | 🟡 Esqueleto |
| `prompts/INDEX.md` | Documentación de prompts | 🟡 Esqueleto |

---

## 7. Variables de Entorno Requeridas

```env
# === Backend (Vercel Environment Variables) ===
ANTHROPIC_API_KEY=             # API key de Anthropic para Claude
CALLBELL_API_KEY=              # API key de Callbell Messages API
CALLBELL_WEBHOOK_SECRET=       # Secreto para validar webhooks de Callbell
SUPABASE_URL=                  # URL del proyecto Supabase
SUPABASE_SERVICE_ROLE_KEY=     # Service role key de Supabase
GOOGLE_SHEETS_API_KEY=         # API key de Google Sheets
GOOGLE_SHEETS_ID=              # ID del spreadsheet de obras sociales y precios

# === Frontend (Vite Environment Variables) ===
VITE_SUPABASE_URL=             # URL del proyecto Supabase (pública)
VITE_SUPABASE_ANON_KEY=        # Anon key de Supabase (pública)
```

---

## 8. Equipo del Proyecto

| Rol | Nombre | Acceso al sistema |
|---|---|---|
| **Referente operativo / Administrador** | Franco Berardi | Acceso completo + métricas + gestión de usuarios |
| **Asesor** | Brenda Gandolfi | Panel completo: tomar, asignar y resolver casos |
| **Asesor** | Catalina Herold | Panel completo |
| **Asesor** | Macarena Abdala | Panel completo |
| **Sede Chiclana** | (secretaría) | Notificaciones por WhatsApp (sin acceso al panel por ahora) |

---

## 9. Riesgos Activos

| # | Riesgo | Impacto | Probabilidad | Severidad | Mitigación |
|---|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | Alto | Alta | 🔴 Crítico | Score de confianza por campo, campos <0.7 resaltados |
| R02 | Latencia de Claude API | Medio | Media | 🟡 Alto | Modelo rápido, timeout con retry |
| R03 | Costo impredecible de Claude API | Medio | Media | 🟡 Alto | Monitoreo de tokens desde día 1 |
| R06 | Webhooks duplicados de Callbell | Medio | Media | 🟡 Alto | Idempotencia por UUID + message_id |
| R08 | Adopción del equipo asesor | Alto | Alta | 🔴 Crítico | Fase 1 con datos mock para validar UX |
| R10 | Cold starts de Vercel Serverless | Bajo | Baja | 🟢 Bajo | Warm-up con cron |

---

## 10. Próximos Pasos Inmediatos

1. ✅ Crear estructura documental del proyecto
2. ⬜ Inicializar repositorio Git + GitHub (`lavalle11-panel`)
3. ⬜ Configurar proyecto React + Vite + Tailwind
4. ⬜ Configurar deploy automático en Vercel
5. ⬜ Configurar proyecto Supabase
6. ⬜ Implementar Fase 1: Panel estático con datos hardcodeados
7. ⬜ Validar diseño con Franco Berardi
8. ⬜ Avanzar a Fase 2, 3, 4, 5 secuencialmente

---

## 11. Contacto y Referencias

- **PRD original:** `PRD_Lavalle11_v1.docx`
- **Autor PRD:** RIA · r-ia.vercel.app
- **Repositorio:** (por definir)
- **Documentación completa:** Ver `docs/` y archivos maestros en raíz
