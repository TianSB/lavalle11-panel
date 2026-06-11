# WORKFLOW — Flujo de Trabajo

> Protocolo para trabajar con asistentes de IA en múltiples sesiones.
> Seguir este flujo **cada vez que se inicia una nueva sesión** para mantener el contexto consistente.

---

## Flujo Obligatorio

### 1. Leer MASTER_CONTEXT.md

Situarse en el proyecto: resumen ejecutivo, stack, estado actual, decisiones clave, arquitectura resumida, próximos pasos.

```
Archivo: MASTER_CONTEXT.md (raíz del proyecto)
```

### 2. Leer PROJECT_STATE.md

Obtener el estado detallado: fase actual, documentación disponible, variables de entorno, riesgos activos, equipo.

```
Archivo: docs/core/PROJECT_STATE.md
```

### 3. Leer DECISIONS.md

Repasar las decisiones técnicas ya tomadas para no repetir deliberaciones ni tomar caminos contradictorios.

```
Archivo: docs/core/DECISIONS.md
```

### 4. Identificar la fase actual

Verificar en `PROJECT_STATE.md` o `TODO.md` en qué fase estamos y qué tareas están pendientes. No avanzar a la siguiente fase hasta que la actual esté completa y validada.

```
Archivos: docs/core/PROJECT_STATE.md, docs/core/TODO.md
```

### 5. Trabajar únicamente sobre la tarea solicitada

- No adelantar trabajo de fases futuras
- No modificar archivos fuera del alcance de la tarea
- Si surge algo importante fuera del alcance, registrarlo en SESSION_LOG.md como observación

### 6. Actualizar SESSION_LOG.md

Al finalizar la sesión, registrar:
- Fecha y objetivo
- Resumen de lo realizado
- Archivos creados o modificados
- Decisiones tomadas
- Pendientes para la próxima sesión
- Estado al cierre

```
Archivo: docs/core/SESSION_LOG.md
```

### 7. Actualizar PROJECT_STATE.md

Reflejar el nuevo estado:
- Actualizar fase actual si corresponde
- Actualizar progreso de documentación
- Actualizar riesgos activos si cambian
- Actualizar próximos pasos

```
Archivo: docs/core/PROJECT_STATE.md
```

### 8. Actualizar MASTER_CONTEXT.md (si hubo cambios relevantes)

Solo si cambió:
- La fase actual del proyecto
- El stack tecnológico
- Decisiones clave
- Próximos pasos inmediatos
- Riesgos principales

```
Archivo: MASTER_CONTEXT.md (raíz del proyecto)
```

---

## Diagrama del Flujo

```
INICIO SESIÓN
    │
    ▼
┌─────────────────────────────┐
│ 1. Leer MASTER_CONTEXT.md   │ ← Contexto rápido
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 2. Leer PROJECT_STATE.md    │ ← Estado detallado
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 3. Leer DECISIONS.md        │ ← Decisiones previas
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 4. Identificar fase actual  │ ← ¿Dónde estamos?
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 5. Trabajar la tarea        │ ← Solo la tarea actual
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 6. Actualizar SESSION_LOG   │ ← Registrar sesión
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 7. Actualizar PROJECT_STATE │ ← Reflejar cambios
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 8. Actualizar MASTER_CONTEXT│ ← Si hubo cambios
└──────────┬──────────────────┘
           ▼
        FIN SESIÓN
```

---

## Buenas Prácticas

| Práctica | Descripción |
|---|---|
| **Commits frecuentes** | Commits por cada archivo completado con mensajes descriptivos |
| **No mezclar fases** | Cada fase tiene su propio plan. No trabajar en tareas de la Fase 3 mientras estás en la Fase 1 |
| **Validar con el cliente** | Después de cada fase, validar con Franco antes de continuar |
| **Documentar decisiones** | Toda decisión técnica importante va a DECISIONS.md como ADR |
| **Monitorear costos** | El costo de Claude API debe monitorearse desde el día 1 de la Fase 3 |
| **Un solo cambio por vez** | Hacer commits pequeños y atómicos |
