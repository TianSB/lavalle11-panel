# Base de Datos — Documentación

> Este directorio contiene toda la documentación de la base de datos (Supabase/PostgreSQL).

| Archivo | Propósito | Estado |
|---|---|---|
| [INDEX.md](./INDEX.md) | Este archivo | ✅ |
| [schema.sql](./schema.sql) | Esquema SQL completo con todas las tablas | 🟡 Por completar |
| [relationships.md](./relationships.md) | Diagrama y descripción de relaciones | 🟡 Por completar |
| [rls-policies.md](./rls-policies.md) | Políticas de Row Level Security | 🟡 Por completar |
| [indexes.md](./indexes.md) | Índices recomendados y justificación | 🟡 Por completar |

## Stack

- **Motor:** PostgreSQL 15 (Supabase)
- **ORM:** No — SQL directo + Supabase SDK
- **Migraciones:** Supabase CLI o scripts SQL versionados
- **Realtime:** Supabase Realtime (WebSocket sobre PostgreSQL)

## Resumen de Tablas

| Tabla | Propósito | Tipo |
|---|---|---|
| `casos` | Tabla principal, cada conversación procesada | Core |
| `extraccion_ia` | Datos extraídos por Claude API (1:1 con caso) | Core |
| `turnos` | Turnos asignados (1:N con caso) | Core |
| `llamadas` | Llamadas registradas (1:N con caso) | Core |
| `usuarios` | Asesores y administradores | Core |
| `configuracion` | Caché de Google Sheets (obras sociales, precios) | Soporte |
| `eventos` | Trazabilidad/auditoría de acciones | Soporte |

## Políticas Generales

- **Soft delete** en todas las tablas principales (no eliminar físicamente)
- **Timestamps** `created_at` y `updated_at` en todas las tablas
- **RLS obligatorio** en tablas con datos de pacientes
- **IDs autoincrementales** con formato LV-XXXX para casos

Ver [schema.sql](./schema.sql) para el esquema completo.
