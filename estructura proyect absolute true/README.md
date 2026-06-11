# Panel de Gestión de Turnos con IA

## Instituto Lavalle 11 · Bahía Blanca

Sistema de gestión inteligente de turnos médicos vía WhatsApp. Analiza conversaciones entrantes con IA, extrae datos estructurados, y presenta cada caso como una card en un panel web para que los asesores resuelvan en segundos.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js (Vercel Serverless Functions) |
| Base de datos | Supabase (PostgreSQL + Realtime + Auth) |
| IA | Claude API (Anthropic) — sonnet-4-20250514 |
| CRM | Callbell API |
| Config | Google Sheets API |

## Estado del Proyecto

📋 **Fase actual:** 0 — Definición y estructura documental
🎯 **Siguiente:** 1 — Panel estático (validación visual)

Ver [PROJECT_STATE.md](./PROJECT_STATE.md) para el estado completo.

## Documentación

| Archivo | Propósito |
|---|---|
| [PROJECT_STATE.md](./PROJECT_STATE.md) | Estado actual del proyecto |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del sistema |
| [DECISIONS.md](./DECISIONS.md) | Decisiones técnicas (ADRs) |
| [TODO.md](./TODO.md) | Plan de trabajo y tareas |
| [SESSION_LOG.md](./SESSION_LOG.md) | Registro de sesiones |

### Subdirectorios

| Carpeta | Contenido |
|---|---|
| [docs/](./docs/INDEX.md) | Documentación general (glosario, riesgos, workflow) |
| [core/](./core/PRD.md) | PRD, requerimientos, casos de uso, reglas de negocio |
| [decisions/](./decisions/) | ADRs individuales |
| [planning/](./planning/roadmap.md) | Roadmap y planes detallados por fase |
| [backend/](./backend/INDEX.md) | Especificaciones del backend |
| [frontend/](./frontend/INDEX.md) | Especificaciones del frontend |
| [database/](./database/INDEX.md) | Esquema de base de datos |
| [prompts/](./prompts/INDEX.md) | Prompts del sistema y plantillas |
