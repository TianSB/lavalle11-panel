# Prompts — Documentación

> Este directorio contiene los prompts del sistema y plantillas para trabajar con IA.

| Archivo | Propósito | Estado |
|---|---|---|
| [INDEX.md](./INDEX.md) | Este archivo | ✅ |
| [system-prompt-claude.md](./system-prompt-claude.md) | Prompt del sistema para Claude API | 🟡 Por completar |
| [session-resume.md](./session-resume.md) | Prompt para retomar sesión de trabajo | 🟡 Por completar |
| [templates/new-feature.md](./templates/new-feature.md) | Template para implementar nueva funcionalidad | 🟡 Por completar |
| [templates/code-review.md](./templates/code-review.md) | Template para code review | 🟡 Por completar |

## Tipos de Prompts

### System Prompt (Claude API)
Prompt enviado a Claude API en cada análisis de conversación. Debe incluir:
- Contexto del sistema (Instituto Lavalle 11)
- Catálogo de prácticas
- Reglas de negocio (obras sociales, copagos, IOMA, etc.)
- Schema JSON de salida esperado
- Instrucciones para extracción de órdenes manuscritas

### Session Resume
Prompt para que una IA retome el contexto del proyecto rápidamente. Usado al inicio de cada sesión de trabajo.

### Templates
Plantillas reutilizables para tareas comunes como:
- Implementar nueva funcionalidad
- Realizar code review
- Investigar y documentar
