# ARCHITECTURE — Panel de Gestión de Turnos con IA

> Documento de arquitectura del sistema. Fuente de verdad para decisiones técnicas estructurales.

---

## 1. Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                        PACIENTE                                  │
│                   (WhatsApp Mobile)                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CALLBELL CRM                                 │
│  (Webhook → POST /api/callbell/webhook)                           │
│  (Messages API → enviar respuesta)                                │
└──────────┬───────────────────────────────────────┬────────────────┘
           │ webhook (HTTP POST)                    │ API (HTTP POST)
           ▼                                       ▲
┌───────────────────────────────────────────────────────────────────┐
│                   VERCELL (Serverless Functions)                    │
│                                                                     │
│  ┌──────────────────────┐    ┌─────────────────────────────┐       │
│  │ Webhook Handler      │───▶│ Orquestador de Caso         │       │
│  │ /api/callbell/webhook│    │ - Valida firma              │       │
│  │                      │    │ - Clasifica tipo            │       │
│  │                      │    │ - Decide: IA o automático   │       │
│  └──────────────────────┘    └───────┬─────────────────────┘       │
│                                      │                             │
│  ┌──────────────────────┐            │                             │
│  │ Claude Service       │◀───────────┤                             │
│  │ - Construye prompt    │            │                             │
│  │ - Envía a API         │            │                             │
│  │ - Valida respuesta    │            │                             │
│  │ - Calcula confianza   │            │                             │
│  └──────────────────────┘            │                             │
│                                      │                             │
│  ┌──────────────────────┐            │                             │
│  │ Google Sheets Sync   │◀───────────┤                             │
│  │ - Cache local        │            │                             │
│  │ - TTL 5 min          │            │                             │
│  └──────────────────────┘            │                             │
│                                      ▼                             │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    Supabase Client                         │      │
│  │  - INSERT caso + extraccion_ia                             │      │
│  │  - Realtime: broadcast a panel                             │      │
│  └──────────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────────┘
                         │                    ▲
                         │ Realtime           │ REST API
                         ▼                    │
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌──────────────┐   │
│  │  casos   │  │extraccion_ia │  │ turnos │  │  llamadas    │   │
│  └──────────┘  └──────────────┘  └────────┘  └──────────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ usuarios │  │configuracion │  │   Realtime Pub/Sub        │   │
│  └──────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                   │
│  RLS: SELECT/UPDATE solo casos donde asesor_id = auth.uid()       │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ Realtime (WebSocket)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PANEL WEB (React + Vite)                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Cola de      │  │ Modal de     │  │ Tablero de           │   │
│  │ Cards        │  │ Resolución   │  │ Métricas (admin)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌───────────────────────────────────────┐    │
│  │ Filtros      │  │ Autenticación (Supabase Auth)          │    │
│  └──────────────┘  └───────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Stack Tecnológico

| Capa | Tecnología | Versión/Modelo | Justificación |
|---|---|---|---|
| Frontend | React + Vite | React 19 | Renderizado eficiente, ecosistema maduro |
| Estilos | Tailwind CSS | v4 | Utility-first, rápido de prototipar |
| Hosting frontend | Vercel | — | Deploy automático desde GitHub, CDN global |
| Backend | Node.js (Serverless Functions) | 20 LTS | Mismo lenguaje que frontend,冷 starts rápidos en Vercel |
| Base de datos | Supabase (PostgreSQL) | — | Postgres + REST + Realtime + Auth integrado |
| Realtime | Supabase Realtime | WebSocket | Sin infraestructura adicional |
| Autenticación | Supabase Auth | Email + password | RLS nativo con Postgres |
| IA | Claude API (Anthropic) | claude-sonnet-4-20250514 | Soporte de imágenes, mejor relación costo/calidad |
| CRM | Callbell API | — | Ya en uso, sin migración necesaria |
| Config remota | Google Sheets API | v4 | Mantenido por el equipo, sin UI adicional |

## 3. Patrones Arquitectónicos

| Patrón | Aplicación |
|---|---|
| **Event-Driven** | Webhook entrante → orquestador → eventos → Realtime → UI |
| **CQRS** | Separación entre escritura (webhook → DB) y lectura (Realtime → panel) |
| **Saga / Orquestación** | Cada caso sigue un flujo definido por su tipo (A–K) |
| **Cache-Aside** | Google Sheets cacheado en Supabase con TTL |
| **Idempotent Receiver** | Webhooks duplicados detectados por UUID |
| **Strangler Fig** | El panel crece junto a Callbell sin reemplazarlo |

## 4. Flujo de Datos Principal

```
WhatsApp ──▶ Callbell ──▶ Webhook ──▶ Vercel ──▶ Claude API ──▶ Supabase ──▶ Panel (Realtime)
  ▲                                                                                  │
  └───────────────────────── Callbell API ◀────── Vercel ◀──────────────────────────┘
```

### Flujo detallado por paso

1. **Paciente escribe a WhatsApp**
2. **Callbell recibe** y dispara webhook HTTP POST a `POST /api/callbell/webhook`
   - Payload: texto, adjuntos, datos del contacto, metadatos de conversación
3. **Backend valida firma** del webhook
4. **Backend decide**: si es mensaje entrante (`status = received`), inicia análisis
5. **Claude Service** construye prompt con: historial, adjuntos (base64), catálogo de prácticas, tabla de obras sociales
6. **Claude API** devuelve JSON estructurado
7. **Backend almacena** en Supabase (tablas `casos` + `extraccion_ia`)
8. **Supabase Realtime** emite evento al panel web
9. **Panel muestra card** en la cola correspondiente
10. **Asesor abre card**, revisa, decide, y confirma
11. **Backend envía respuesta** via Callbell Messages API
12. **Caso se cierra** con closing reason y timestamp

## 5. Casos de Resolución Automática (Tipo B)

Los siguientes estudios **no requieren intervención del asesor**:

- Radiografías (incluyendo espinografía y medición de MMII)
- Panorámicas dentales
- TAC Cone Beam dental

*Excepción: si la radiografía panorámica tiene obra social que requiere autorización previa, se eleva a asesor.*

## 6. Derivación Automática a Chiclana

Si la práctica detectada es: PET CT, SPECT CT, Centellograma, Perfusión Miocárdica, Gammagrafía, Cámara Gamma:
1. Se crea card con flag `CHICLANA`
2. Se activa flujo de derivación
3. Se notifica a secretaría de Chiclana vía WhatsApp

## 7. Seguridad

- API keys de Anthropic y Callbell: solo en variables de entorno de Vercel (nunca en frontend)
- Supabase RLS: cada asesor solo ve/modifica sus casos autorizados
- Datos de pacientes: no se envían a terceros fuera de Callbell (que ya los posee) y Anthropic (bajo acuerdo de privacidad)
- Validación de firma de webhook de Callbell en cada request

## 8. Prácticas No Realizadas (Respuesta Automática)

El sistema responde automáticamente que el instituto no realiza:
- Resonancia magnética
- Histerosalpingografía
- Electromiografía
- Polisomnografía
- Endoscopía (alta y baja)
- Colonoscopía
- Tomografía de senos paranasales (solo realizan CBCT dental)

## 9. Endpoints de la API

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/callbell/webhook` | Recibir eventos de Callbell |
| GET | `/api/casos` | Listar casos (con filtros) |
| GET | `/api/casos/:id` | Obtener detalle de un caso |
| PATCH | `/api/casos/:id` | Actualizar caso (asignar, resolver, etc.) |
| POST | `/api/casos/:id/enviar` | Enviar mensaje de respuesta |
| POST | `/api/casos/:id/llamada` | Registrar llamada |
| GET | `/api/metricas` | Obtener métricas del tablero (admin) |

Ver [backend/api-endpoints.md](./backend/api-endpoints.md) para especificaciones detalladas.

## 10. Modelo de Datos (Resumen)

Ver [database/schema.sql](./database/schema.sql) para el esquema completo.

### Entidades principales:
- `casos` — Tabla principal, cada conversación procesada
- `extraccion_ia` — Datos extraídos por Claude (1:1 con caso)
- `turnos` — Turnos asignados (1:N con caso)
- `llamadas` — Llamadas registradas (1:N con caso)
- `usuarios` — Asesores y administradores
- `configuracion` — Caché de Google Sheets

## 11. Consideraciones de Escalabilidad

- Vercel Serverless escala automáticamente con el tráfico
- Supabase Realtime maneja miles de conexiones concurrentes
- Google Sheets cacheado para evitar rate limits
- Claude API: monitorear tokens y considerar cola de procesamiento si la latencia es crítica
- Idempotencia en webhooks para evitar duplicados

## 12. Reglas de Negocio Clave

Ver [core/business-rules.md](./core/business-rules.md) para la lista completa.

- Token IOMA obligatorio en confirmaciones
- Radiografías de traumatólogos sin informe escrito
- Precios con vigencia mensual desde Google Sheets
- Seguimiento obligatorio para casos Tipo H (punción/biopsia)
