# DECISIONS — Registro de Decisiones Técnicas

> Formato: ADR (Architecture Decision Record) simplificado.
> Cada decisión importante se registra aquí con contexto, opciones consideradas y justificación.

---

## ADR-001: Stack Tecnológico

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Elegir el stack tecnológico para el panel de gestión de turnos. El equipo es pequeño, el proyecto debe entregarse rápido, y la deuda técnica debe ser mínima.

### Opciones Consideradas

| Opción | Frontend | Backend | DB | Hosting |
|---|---|---|---|---|
| A | React + Vite | Node.js Serverless | Supabase | Vercel |
| B | Next.js Fullstack | Next.js API Routes | Supabase | Vercel |
| C | React + Vite | Python FastAPI | PostgreSQL RDS | AWS |
| D | Vue + Nuxt | Node.js Express | MongoDB | Railway |

### Decisión
**Opción A** — React + Vite + Tailwind (frontend), Node.js Serverless (backend), Supabase (DB + Realtime + Auth), Vercel (hosting).

### Justificación
- Supabase reemplaza 3 servicios: DB, Realtime, Auth — reduce complejidad operativa
- Vercel Serverless se escala automáticamente
- Node.js permite compartir tipos con el frontend (TypeScript)
- React + Vite + Tailwind es el stack más productivo para paneles internos
- El equipo ya tiene experiencia con React

### Consecuencias
- Dependencia de Vercel para serverless (vendor lock-in leve)
- Cold starts en funciones serverless (mitigable con warm-up)
- Supabase Realtime tiene limitaciones en el plan gratuito

---

## ADR-002: Modelo de IA

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Elegir el modelo de IA para analizar conversaciones y extraer datos estructurados de órdenes médicas manuscritas.

### Opciones Consideradas

| Opción | Modelo | Ventajas | Desventajas |
|---|---|---|---|
| A | Claude Sonnet 4 (Anthropic) | Bueno con imágenes, JSON estructurado, rápido | Costo por token |
| B | GPT-4o (OpenAI) | Similar capacidad | Más caro, ecosistema diferente |
| C | Gemini 2.0 (Google) | Buen precio | Menos probado con manuscritos médicos |
| D | Claude Haiku 3.5 | Más barato | Menos capacidad con imágenes |

### Decisión
**Opción A** — Claude Sonnet 4-20250514 (Anthropic).

### Justificación
- Excelente en extracción de texto manuscrito de imágenes
- Responde consistentemente en JSON estructurado
- Buen balance costo/velocidad/calidad
- El SDK de Anthropic para Node.js es maduro

### Consecuencias
- Costo variable según volumen de imágenes
- Datos de pacientes enviados a Anthropic (revisar términos de privacidad)
- Dependencia de un solo proveedor de IA

---

## ADR-003: Base de Datos y Realtime

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Necesitamos base de datos relacional + actualizaciones en tiempo real + autenticación. Evaluamos opciones integradas vs. servicios separados.

### Opciones Consideradas

| Opción | DB | Realtime | Auth | Mantenimiento |
|---|---|---|---|---|
| A | Supabase (PostgreSQL) | Supabase Realtime | Supabase Auth | Un solo servicio |
| B | PostgreSQL + Socket.io | Socket.io propio | JWT manual | 3 servicios separados |
| C | Firebase Firestore | Firebase Realtime | Firebase Auth | No relacional |

### Decisión
**Opción A** — Supabase unificado.

### Justificación
- Un solo SDK para DB, Realtime y Auth
- PostgreSQL relacional (ideal para datos estructurados de turnos)
- Realtime vía WebSocket sin infraestructura extra
- RLS nativo: la seguridad se define en la DB
- Plan gratuito generoso para el volumen del proyecto

### Consecuencias
- Dependencia de Supabase (vendor lock-in)
- Realtime tiene límites de conexiones en plan gratuito
- Migración futura a PostgreSQL nativo posible pero trabajosa

---

## ADR-004: Formato de Documentación

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Necesitamos un sistema documental que permita retomar el proyecto en múltiples sesiones con IA sin perder contexto.

### Decisión
Estructura de carpetas con archivos markdown en `/docs`, `/core`, `/decisions`, `/planning`, `/backend`, `/frontend`, `/database`, `/prompts`, más 5 archivos maestros en la raíz.

### Justificación
- Markdown es universal y versionable con Git
- Separación clara por dominio (backend, frontend, DB)
- Archivos maestros dan visión general sin buscar en subcarpetas
- Los ADRs en `/decisions` registran el "por qué" de cada decisión
- Los prompts en `/prompts` permiten a la IA retomar contexto rápido

### Consecuencias
- Requiere disciplina para mantener la documentación actualizada
- Archivos maestros deben actualizarse al iniciar cada sesión

---

## ADR-005: Gestión de Configuración (Obras Sociales y Precios)

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
El equipo de Lavalle 11 mantiene una planilla de Google Sheets con obras sociales y precios. ¿Cómo integrarla?

### Opciones Consideradas

| Opción | Descripción |
|---|---|
| A | Leer Google Sheets API en tiempo real con cache local |
| B | Migrar a tabla en Supabase con UI de administración |
| C | Script periódico que sincroniza Google Sheets → Supabase |

### Decisión
**Opción A** — Google Sheets API con cache local en Supabase (TTL 5 minutos).

### Justificación
- El equipo ya mantiene la planilla — no queremos que aprendan una UI nueva
- Google Sheets es la fuente de verdad única
- Cache local evita rate limits y mejora latencia
- Sincronización lazy: se consulta cuando llega un caso

### Consecuencias
- Dependencia de Google Sheets API (caída del servicio afecta al sistema)
- Latencia adicional en el primer request después del TTL
- Sin historial de cambios (lo tiene Google Sheets nativamente)

---

## ADR-006: Estrategia de Despliegue

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
¿Cómo desplegamos el frontend y backend?

### Decisión
**Vercel** para ambos, con monorepo en GitHub.

- Frontend: deploy automático desde `main` a `vercel.app`
- Backend: serverless functions en el mismo proyecto Vercel
- Supabase: proyecto separado, conectado por variables de entorno
- Dominio custom pendiente de definir

### Justificación
- Vercel es la plataforma más simple para React + Serverless
- Preview deployments por PR para revisar cambios
- Variables de entorno seguras para API keys

### Consecuencias
- Serverless cold starts (10–50ms en Node.js en Vercel, aceptable)
- Sin WebSocket persistente (Supabase Realtime lo cubre)
- Costos de Vercel Pro si se excede el plan gratuito
