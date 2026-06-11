# Matriz de Riesgos Técnicos

> Identificación, análisis y mitigación de riesgos del proyecto.

---

## Resumen

| # | Riesgo | Impacto | Probabilidad | Severidad |
|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | Alto | Alta | 🔴 Crítico |
| R02 | Latencia de Claude API | Medio | Media | 🟡 Alto |
| R03 | Costo impredecible de Claude API | Medio | Media | 🟡 Alto |
| R04 | Dependencia de Google Sheets API | Bajo | Baja | 🟢 Medio |
| R05 | Callbell API rate limits | Bajo | Baja | 🟢 Medio |
| R06 | Webhook duplicado de Callbell | Medio | Media | 🟡 Alto |
| R07 | Seguridad de datos de salud | Alto | Baja | 🟡 Alto |
| R08 | Adopción del equipo asesor | Alto | Alta | 🔴 Crítico |
| R09 | Casos no clasificables (outliers) | Medio | Baja | 🟢 Medio |
| R10 | Cold starts de Vercel Serverless | Bajo | Baja | 🟢 Bajo |

---

## Detalle de Riesgos

### R01 — Precisión de Claude en órdenes manuscritas
**Impacto:** 🔴 Alto | **Probabilidad:** 🔴 Alta

**Descripción:** Las órdenes médicas son documentos manuscritos. Si la extracción de Claude falla consistentemente, el asesor pierde tiempo en lugar de ganarlo.

**Mitigación:**
- Score de confianza por campo (0–1); campos < 0.7 se resaltan en amarillo
- Feedback loop para mejorar prompts con ejemplos reales
- El asesor puede corregir campos manualmente
- Evaluación periódica de precisión contra un conjunto de validación

---

### R02 — Latencia de Claude API
**Impacto:** 🟡 Medio | **Probabilidad:** 🟡 Media

**Descripción:** Si el análisis toma > 15 segundos, la experiencia del asesor se degrada.

**Mitigación:**
- Usar modelo `claude-sonnet-4-20250514` (optimizado para velocidad)
- Timeout y retry con backoff exponencial
- Considerar cola de procesamiento asíncrono si la latencia es crítica

---

### R03 — Costo impredecible de Claude API
**Impacto:** 🟡 Medio | **Probabilidad:** 🟡 Media

**Descripción:** 40–80 msgs/día × tokens de imágenes puede escalar rápidamente.

**Mitigación:**
- Monitorear uso de tokens desde el día 1 (dashboard)
- Limitar resolución de imágenes antes de enviar a Claude
- Cache de respuestas para mensajes similares
- Alertas de presupuesto

---

### R04 — Dependencia de Google Sheets API
**Impacto:** 🟢 Bajo | **Probabilidad:** 🟢 Baja

**Descripción:** Si Google Sheets cae o se excede la cuota, las cards pierden datos de cobertura.

**Mitigación:**
- Cache local en Supabase con TTL de 5 minutos
- Fallback al último valor conocido si no se puede sincronizar
- Alerta si no se puede sincronizar

---

### R05 — Callbell API rate limits
**Impacto:** 🟢 Bajo | **Probabilidad:** 🟢 Baja

**Descripción:** Si muchos casos se resuelven en simultáneo, los envíos pueden fallar.

**Mitigación:**
- Cola de mensajes salientes con retry exponencial
- Monitorear headers de rate limit de Callbell

---

### R06 — Webhook duplicado de Callbell
**Impacto:** 🟡 Medio | **Probabilidad:** 🟡 Media

**Descripción:** Callbell puede reenviar el mismo webhook múltiples veces.

**Mitigación:**
- Idempotencia por `callbell_uuid` + `message_id`
- Skip si el caso ya fue procesado

---

### R07 — Seguridad de datos de salud
**Impacto:** 🟡 Alto | **Probabilidad:** 🟢 Baja

**Descripción:** Datos de pacientes procesados por Anthropic (servidores en EEUU). Sin regulación HIPAA explícita (Argentina), pero riesgo reputacional.

**Mitigación:**
- Datos mínimos necesarios en el prompt
- No almacenar imágenes de órdenes fuera de Callbell
- Política de retención configurable

---

### R08 — Adopción del equipo asesor
**Impacto:** 🔴 Alto | **Probabilidad:** 🔴 Alta

**Descripción:** Si los asesores no confían en la IA o prefieren el flujo actual, el sistema no se usa.

**Mitigación:**
- Fase 1: panel con datos hardcodeados para validar UX
- Iterar con feedback de Franco y el equipo
- Mostrar score de confianza explícitamente
- Capacitación y acompañamiento en el rollout

---

### R09 — Casos no clasificables
**Impacto:** 🟢 Bajo | **Probabilidad:** 🟢 Baja

**Descripción:** Un caso puede no encajar claramente en ningún tipo A–K.

**Mitigación:**
- Tipo "No clasificado" como default
- El asesor puede reclasificar manualmente
- Feedback a IA para mejorar clasificación

---

### R10 — Cold starts de Vercel Serverless
**Impacto:** 🟢 Bajo | **Probabilidad:** 🟢 Baja

**Descripción:** Cold starts de funciones serverless agregan latencia.

**Mitigación:**
- Considerar cron job de Vercel para mantener warm
- Función dedicada si el volumen crece
