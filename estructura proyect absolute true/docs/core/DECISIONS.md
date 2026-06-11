# DECISIONS — Registro de Decisiones Técnicas (ADRs)

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-09
> **Formato:** Architecture Decision Record (ADR)
> **Propósito:** Mantener registro del "por qué" detrás de cada decisión técnica importante.

---

## ADR-001: Stack Tecnológico

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Elegir el stack tecnológico para construir un panel web de gestión de turnos con IA. El equipo de desarrollo es pequeño (1–2 personas), el proyecto debe entregar valor rápido (10–12 semanas), y la deuda técnica debe ser mínima para facilitar mantenimiento futuro.

### Restricciones
- El sistema debe funcionar en navegadores modernos (Chrome, Edge, Firefox)
- El backend debe exponer webhooks y consumir APIs externas (Callbell, Anthropic, Google)
- La base de datos debe soportar Realtime para actualizaciones en vivo
- Debe ser económicamente viable para el volumen actual (40–80 mensajes/día)
- No se requiere app móvil nativa

### Opciones Consideradas

| Opción | Frontend | Backend | DB + Realtime | Auth | Hosting |
|---|---|---|---|---|---|
| **A** | React + Vite | Node.js Serverless | Supabase (todo en uno) | Supabase Auth | Vercel |
| **B** | Next.js Fullstack | Next.js API Routes | Supabase | NextAuth / Supabase | Vercel |
| **C** | React + Vite | Python FastAPI | PostgreSQL + Socket.io | JWT manual | AWS / Railway |
| **D** | Vue 3 + Vite | Node.js Express | Supabase | Supabase Auth | Vercel |

### Decisión
**Opción A** — React + Vite + Tailwind CSS (frontend), Node.js Serverless Functions (backend), Supabase (PostgreSQL + Realtime + Auth), Vercel (hosting).

### Justificación
1. **Supabase** reemplaza 3 servicios (DB, Realtime, Auth) en uno — reduce complejidad operativa drásticamente
2. **Vercel Serverless** escala a cero cuando no hay tráfico y escala automáticamente en picos — ideal para 40–80 msg/día
3. **Node.js en backend** permite compartir tipos de TypeScript con el frontend
4. **React + Vite + Tailwind** es el stack más productivo para paneles internos tipo dashboard
5. **Todo en Vercel** simplifica el deploy: frontend y backend en el mismo proyecto
6. El equipo de desarrollo tiene experiencia comprobada con React/Node.js

### Consecuencias
- Vendor lock-in leve con Vercel y Supabase (mitigable porque ambos usan tecnologías estándar: React, Node.js, PostgreSQL)
- Cold starts en funciones serverless (10–50ms en Node.js, aceptable para este uso)
- Límites del plan gratuito de Supabase pueden requerir upgrade al crecer

### Referencias
- PRD Sección 10.1 — Stack tecnológico propuesto
- [supabase.com/docs](https://supabase.com/docs)
- [vercel.com/docs](https://vercel.com/docs)

---

## ADR-002: Modelo de IA para Análisis de Conversaciones

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Elegir el modelo de IA para analizar conversaciones de WhatsApp, extraer datos estructurados de órdenes médicas manuscritas (enviadas como foto o PDF), clasificar el tipo de caso, y generar respuestas automáticas.

### Requisitos del modelo
- Capacidad de leer texto manuscrito en imágenes (español, vocabulario médico)
- Salida en JSON estructurado y consistente
- Baja latencia (ideal < 5s por análisis)
- Buen equilibrio entre calidad y costo
- SDK para Node.js

### Opciones Consideradas

| Opción | Modelo | Ventajas | Desventajas |
|---|---|---|---|
| **A** | Claude Sonnet 4 (Anthropic) | Excelente con imágenes, JSON estructurado, rápido, SDK maduro | Costo por token medio-alto |
| **B** | GPT-4o (OpenAI) | Similar capacidad multimodal | Más caro, costos menos predecibles |
| **C** | Claude Haiku 3.5 (Anthropic) | Más barato que Sonnet, rápido | Menor precisión en manuscritos |
| **D** | Gemini 2.0 Flash (Google) | Buen precio, baja latencia | Menos probado con manuscritos médicos en español |

### Decisión
**Opción A** — Claude Sonnet 4 (modelo `claude-sonnet-4-20250514`) de Anthropic.

### Justificación
1. Rendimiento superior en extracción de texto manuscrito en español, validado en pruebas con órdenes médicas reales
2. Responde consistentemente en JSON estructurado siguiendo el schema indicado en el prompt
3. El SDK `@anthropic-ai/sdk` para Node.js es maduro y bien documentado
4. Buen balance entre velocidad (< 5s típico), calidad de extracción y costo
5. Anthropic ofrece términos de privacidad que no usan los datos enviados para entrenamiento

### Consecuencias
- Costo operativo variable según volumen de imágenes y tamaño de los adjuntos
- Datos de pacientes enviados a servidores de Anthropic (mitigación: solo datos necesarios, sin almacenar imágenes fuera de Callbell)
- Dependencia de un solo proveedor de IA (mitigación: la abstracción del servicio permite cambiar de modelo con bajo esfuerzo)

### Referencias
- PRD Sección 2 (Paso 2), Sección 10.4
- [docs.anthropic.com](https://docs.anthropic.com)

---

## ADR-003: Base de Datos y Sistema de Realtime

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Necesitamos una base de datos relacional (los turnos, obras sociales y pacientes tienen relaciones bien definidas) + actualizaciones en tiempo real (las cards deben aparecer sin recargar la página) + autenticación.

### Opciones Consideradas

| Opción | DB | Realtime | Auth | Mantenimiento |
|---|---|---|---|---|
| **A** | Supabase (PostgreSQL) | Supabase Realtime (WebSocket) | Supabase Auth (GoTrue) | Un solo proveedor |
| **B** | PostgreSQL RDS | Socket.io propio | JWT manual + bcrypt | 3 sistemas separados |
| **C** | Firebase Firestore | Firebase Realtime | Firebase Auth | No relacional |
| **D** | MongoDB Atlas | Change Streams + WebSocket | JWT manual | Documental |

### Decisión
**Opción A** — Supabase (PostgreSQL + Realtime + Auth unificados).

### Justificación
1. **Relacional:** PostgreSQL es ideal para datos estructurados con relaciones (caso → turnos → llamadas)
2. **Integración vertical:** Un solo SDK (`@supabase/supabase-js`) para DB, Realtime y Auth
3. **RLS nativo:** Las políticas de seguridad se definen en la base de datos, no en el código de la aplicación
4. **Realtime sobre PostgreSQL:** Escucha cambios en tablas usando el replication slot de Postgres — no requiere infraestructura adicional
5. **Costo:** Plan gratuito muy generoso para el volumen del proyecto
6. **Migración futura:** PostgreSQL estándar — si algún día se quiere migrar, es posible

### Consecuencias
- Vendor lock-in con Supabase (mitigación: PostgreSQL estándar, migrable; Auth tiene capa de abstracción)
- Realtime tiene límites de conexiones concurrentes en plan gratuito
- No tiene graphql nativo (pero no lo necesitamos)

### Referencias
- PRD Sección 10.1, 10.2, 10.5
- [supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)

---

## ADR-004: Estrategia de Documentación del Proyecto

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
El proyecto se desarrollará en múltiples sesiones con asistentes de IA. Necesitamos un sistema documental que permita retomar el trabajo en cualquier momento sin pérdida de contexto, incluso meses después.

### Requisitos
- Versionable (Git-friendly)
- Legible por humanos y por IA
- Separado por dominios (backend, frontend, DB, etc.)
- Los documentos maestros deben dar una visión general rápida
- Las decisiones técnicas deben tener contexto y justificación registrados

### Decisión
Estructura de documentación en Markdown con:
- **5 archivos maestros** en `docs/core/`: PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO, SESSION_LOG
- **Subdirectorios por dominio**: `backend/`, `frontend/`, `database/`, `prompts/`
- **ADRs** en `decisions/` con template estandarizado
- **Sesiones registradas** en SESSION_LOG.md con formato de entrada consistente

### Justificación
1. Markdown es universal — cualquier editor, cualquier IA, cualquier herramienta lo lee
2. Git permite trackear cambios en la documentación, revertir errores y revisar el historial de decisiones
3. Separación por dominio permite encontrar la información relevante rápidamente
4. Los archivos maestros en `docs/core/` son el punto de entrada: se leen primero y dan contexto completo
5. Los ADRs documentan el "por qué" — esencial cuando se retoma el proyecto meses después

### Consecuencias
- Requiere disciplina para mantener la documentación actualizada
- La documentación desactualizada es peor que ninguna — hay que actualizar al final de cada sesión

### Referencias
- [https://adr.github.io/](https://adr.github.io/) — Formato ADR
- `docs/workflow.md` — Flujo de trabajo detallado

---

## ADR-005: Gestión de Configuración (Obras Sociales y Precios)

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
El equipo de Lavalle 11 mantiene una planilla de Google Sheets con la tabla de obras sociales (coberturas, copagos, autorizaciones) y la tabla de precios de los estudios. El equipo no tiene presupuesto ni tiempo para aprender una interfaz de administración nueva.

### Opciones Consideradas

| Opción | Descripción | Ventajas | Desventajas |
|---|---|---|---|
| **A** | Google Sheets API + cache local | El equipo sigue editando su planilla. El sistema consulta bajo demanda y cachea | Dependencia de API externa, latencia en primer request |
| **B** | Migrar a tabla en Supabase + UI admin | Todo en el mismo ecosistema | Requiere construir UI de administración + migrar datos |
| **C** | Sincronización periódica (cron) | Script que copia Sheets → Supabase cada N minutos | Datos pueden estar desactualizados hasta N minutos |

### Decisión
**Opción A** — Google Sheets API con cache local en Supabase (TTL de 5 minutos, refresco lazy).

### Justificación
1. El equipo ya mantiene y confía en su planilla de Google Sheets — cambiar su flujo de trabajo sería contraproducente
2. Google Sheets es la fuente de verdad única y evita duplicación de datos
3. El cache con TTL de 5 minutos asegura que los datos nunca estén desactualizados por más de 5 minutos
4. El refresco lazy (se actualiza cuando se consulta y el cache expiró) evita consultas innecesarias a la API
5. Google Sheets API tiene cuota generosa para este volumen de consultas

### Consecuencias
- Dependencia de Google Sheets API: si el servicio cae, el sistema opera con los últimos datos cacheados
- Latencia adicional de ~1–2 segundos cuando el cache expira y hay que refrescar
- Sin historial de cambios en el sistema (lo tiene Google Sheets nativamente)

### Referencias
- PRD Sección 7.1 (Tabla de obras sociales), Sección 7.8 (Tabla de precios)
- [developers.google.com/sheets/api](https://developers.google.com/sheets/api)

---

## ADR-006: Estrategia de Despliegue y CI/CD

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada

### Contexto
Necesitamos una estrategia de despliegue que permita:
- Deploy automático desde Git
- Preview deployments para revisar cambios (PR reviews)
- Variables de entorno seguras para API keys
- Frontend y backend en el mismo lugar (simplicidad)

### Decisión

| Aspecto | Decisión |
|---|---|
| **Plataforma** | Vercel (Pro) |
| **Repositorio** | GitHub (monorepo) |
| **CI/CD** | Vercel GitHub Integration (auto-deploy desde `main`) |
| **Preview** | Vercel Preview Deployments por PR |
| **Base de datos** | Supabase (proyecto separado) |
| **Dominio** | Por definir |
| **Monitoreo** | Vercel Analytics + Supabase Dashboard |

### Justificación
1. **Vercel** es la plataforma más simple para React + Serverless Functions — deploy en segundos
2. **Preview deployments** permiten revisar cambios visualmente antes de mergear a `main`
3. **Variables de entorno** seguras y por ambiente (development, preview, production)
4. **Monorepo** mantiene frontend y backend juntos, simplifica el desarrollo
5. **Supabase** como proyecto separado (no en Vercel) porque su plan gratuito es más generoso para DB

### Consecuencias
- Cold starts en serverless: 10–50ms en Node.js, aceptable
- Sin WebSocket persistente server-side (Supabase Realtime lo cubre desde el frontend directo)
- Costos de Vercel Pro si se excede el plan gratuito (~$20/mes)

### Referencias
- [vercel.com/docs/deployments](https://vercel.com/docs/deployments)
- [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables)

---

## ADR-007: TypeScript Obligatorio

**Fecha:** 2026-06-09
**Estado:** ✅ Aceptada (confirmada por el usuario)

### Contexto
Elegir el nivel de tipado para el código del proyecto. El equipo quiere garantizar consistencia, reducir errores en tiempo de ejecución y mejorar la experiencia de desarrollo.

### Opciones Consideradas

| Opción | Descripción |
|---|---|
| **A** | TypeScript estricto en frontend y backend |
| **B** | JavaScript sin tipos |
| **C** | TypeScript solo en frontend, JavaScript en backend |

### Decisión
**Opción A** — TypeScript estricto en frontend y backend. Modo `strict: true` en ambos `tsconfig.json`.

### Justificación
1. El frontend (React) y backend (Node.js) comparten tipos — las interfaces de los payloads se definen una vez
2. Los esquemas de Claude API y las respuestas de Callbell se tipan estrictamente
3. Los endpoints de la API tienen tipos de request/response que eliminan errores de integración
4. El tipado estricto reduce la necesidad de tests manuales en las capas de integración

### Consecuencias
- Mayor tiempo de escritura inicial (tipar todo)
- Menos bugs en runtime y mejor autocompletado en el IDE
- Curva de aprendizaje para asesores sin experiencia en TypeScript
