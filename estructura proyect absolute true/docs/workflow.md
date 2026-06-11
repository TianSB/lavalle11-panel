# Flujo de Trabajo para Sesiones con IA

> Cómo trabajar con asistentes de IA (Codebuff, ChatGPT, Claude, etc.) en múltiples sesiones sin perder contexto.

---

## Principios

1. **Siempre empezar leyendo PROJECT_STATE.md** — tiene el estado actual del proyecto
2. **Siempre leer TODO.md** — saber qué sigue y el progreso actual
3. **Siempre registrar la sesión en SESSION_LOG.md** al finalizar
4. **Actualizar TODO.md** al completar o iniciar tareas
5. **Commits frecuentes** con mensajes descriptivos

---

## Inicio de Sesión

```markdown
## Prompt de inicio para la IA

Actuá como un Technical Project Manager Senior y Software Architect.

Proyecto: "Panel de Gestión de Turnos con IA para Instituto Lavalle 11"

Stack: React + Vite + Tailwind / Node.js Serverless / Supabase / Claude API

Leé los siguientes archivos para retomar contexto:
1. PROJECT_STATE.md — estado actual
2. TODO.md — tareas pendientes y progreso
3. SESSION_LOG.md — última sesión registrada
4. ARCHITECTURE.md — arquitectura del sistema

Mi objetivo en esta sesión es: [DESCRIBIR OBJETIVO]
```

---

## Durante la Sesión

- **Antes de editar**, leer los archivos relevantes del proyecto
- **Antes de decidir**, documentar la decisión en DECISIONS.md (formato ADR)
- **Mantener archivos maestros actualizados**: PROJECT_STATE.md, TODO.md
- **Si hay cambios arquitectónicos**, actualizar ARCHITECTURE.md

---

## Cierre de Sesión

```markdown
## Registro en SESSION_LOG.md

## Sesión [N] — [YYYY-MM-DD]

**Objetivo:** [Qué se buscaba lograr]
**Duración:** [Tiempo estimado]
**Herramientas:** [IA, comandos, servicios usados]

### Resumen
[2–3 párrafos]

### Archivos Creados / Modificados
- `ruta/al/archivo` — [qué se hizo]

### Decisiones Tomadas
- [Decisión importante]

### Pendientes para la Próxima Sesión
- [ ] Tarea 1
- [ ] Tarea 2

### Estado al Cierre
- [Estado general]
```

---

## Git Workflow

```bash
# Rama principal
main        # Producción — solo merges desde develop
develop     # Integración continua
feature/*   # Features nuevas (en desarrollo)

# Commits
feat:       # Nueva funcionalidad
fix:        # Corrección de bug
docs:       # Documentación
refactor:   # Refactorización
chore:      # Tareas de mantenimiento
```

---

## Recomendaciones

- **No mezclar fases**: completar Fase 1 antes de empezar Fase 2
- **Commits después de cada archivo completado**
- **Validar con Franco** antes de pasar a la siguiente fase
- **Monitorear costos de Claude API** desde el día 1
- **Actualizar TODO.md** al completar cada tarea
