# Roadmap de Desarrollo

> Plan de fases con entregables, duración estimada y dependencias.
> Basado en el PRD sección 11 y el análisis arquitectónico.

---

## Diagrama de Dependencias

```
Fase 1 (Panel UI)
    │
    ▼
Fase 2 (Backend + Webhooks)
    │
    ▼
Fase 3 (Claude IA)
    │
    ▼
Fase 4 (Acciones del Asesor)
    │
    ▼
Fase 5 (Seguimiento y Métricas)
```

---

## Fase 1 — Panel Estático (Validación Visual)

**Duración estimada:** 1–2 semanas
**Dependencias:** Ninguna

### Entregables
- ✅ Panel web con cards de ejemplo (datos hardcodeados)
- ✅ Modal de resolución completo con todos los campos e interacciones
- ✅ Botón de llamada WhatsApp Desktop funcional
- ✅ Vista previa del mensaje generada en tiempo real
- ✅ Autenticación básica por asesor
- ✅ 5 vistas de filtro funcionales

### Criterio de éxito
Validación del diseño con Franco Berardi antes de conectar el backend.

### Riesgos
- Diseño no alineado con expectativas del equipo
- Cambios mayores después de ver el panel funcionando

---

## Fase 2 — Backend y Webhook de Callbell

**Duración estimada:** 1–2 semanas
**Dependencias:** Fase 1

### Entregables
- ✅ Endpoint `/api/callbell/webhook` operativo en Vercel
- ✅ Procesamiento de eventos `message_created`
- ✅ Creación de casos en Supabase
- ✅ Cards reales apareciendo en el panel via Realtime
- ✅ Idempotencia de webhooks

### Criterio de éxito
El panel recibe casos reales de Callbell en tiempo real.

### Riesgos
- Callbell webhook configuration (dependencia externa)
- Manejo de adjuntos grandes

---

## Fase 3 — Análisis con Claude IA

**Duración estimada:** 2–3 semanas
**Dependencias:** Fase 2

### Entregables
- ✅ Integración con Claude API para análisis de texto e imágenes
- ✅ Extracción de campos estructurados de la conversación
- ✅ Lectura de órdenes médicas manuscritas (imágenes)
- ✅ Consulta de tabla de obras sociales en Google Sheets
- ✅ Flags automáticos: copago, baja confianza, falta documentación
- ✅ Clasificación de tipo de caso (A–K)
- ✅ Resolución automática Tipo B

### Criterio de éxito
Las cards aparecen con datos prellenados y resumen de IA.

### Riesgos
- Precisión de extracción de manuscritos
- Costo de API de Claude
- Latencia del análisis

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Duración estimada:** 2–3 semanas
**Dependencias:** Fase 3

### Entregables
- ✅ Confirmar turno — envío de mensaje via Callbell API
- ✅ Resolución automática de casos Tipo B
- ✅ Derivación a Chiclana con notificación por WhatsApp
- ✅ Registro de llamadas en el sistema
- ✅ Cierre de conversación en Callbell desde el panel
- ✅ Manejo de errores y retry en envíos

### Criterio de éxito
El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).

### Riesgos
- Rate limits de Callbell API
- Errores en envío de mensajes
- Manejo de casos edge

---

## Fase 5 — Seguimiento y Métricas

**Duración estimada:** 2 semanas
**Dependencias:** Fase 4 (puede solaparse parcialmente)

### Entregables
- ✅ Sistema de notas internas con fecha de seguimiento
- ✅ Vista de seguimientos pendientes para el día
- ✅ Reconocimiento de contactos recurrentes con historial
- ✅ Tablero de métricas operativas
- ✅ Historial completo por caso
- ✅ Exportación de datos básica (CSV)

### Criterio de éxito
Visibilidad total del pipeline de consultas.

---

## Resumen de Tiempos

| Fase | Duración | Semana Inicio | Semana Fin |
|---|---|---|---|
| Fase 0 | Documentación | — | — |
| Fase 1 | 1–2 semanas | Semana 1 | Semana 2 |
| Fase 2 | 1–2 semanas | Semana 3 | Semana 4 |
| Fase 3 | 2–3 semanas | Semana 5 | Semana 7 |
| Fase 4 | 2–3 semanas | Semana 8 | Semana 10 |
| Fase 5 | 2 semanas | Semana 11 | Semana 12 |

**Total estimado:** 10–12 semanas desde el inicio del desarrollo.
