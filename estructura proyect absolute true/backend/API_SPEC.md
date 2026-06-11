# API SPEC — Especificación de la API REST

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-09
> **Base URL:** `https://[domain].vercel.app/api`
> **Formato:** JSON. Sin código — solo especificación de contratos.

---

## 1. Resumen de Endpoints

| # | Método | Ruta | Categoría | Auth |
|---|---|---|---|---|
| 1 | POST | `/api/callbell/webhook` | Callbell | Firma HMAC |
| 2 | GET | `/api/casos` | Casos | Supabase Auth |
| 3 | GET | `/api/casos/:id` | Casos | Supabase Auth |
| 4 | PATCH | `/api/casos/:id` | Casos | Supabase Auth |
| 5 | POST | `/api/casos/:id/asignar` | Casos | Supabase Auth |
| 6 | POST | `/api/casos/:id/enviar` | Casos | Supabase Auth |
| 7 | POST | `/api/casos/:id/llamada` | Casos | Supabase Auth |
| 8 | POST | `/api/casos/:id/cerrar` | Casos | Supabase Auth |
| 9 | POST | `/api/casos/:id/reabrir` | Casos | Supabase Auth |
| 10 | GET | `/api/casos/:id/historial` | Casos | Supabase Auth |
| 11 | POST | `/api/casos/:id/turno` | Turnos | Supabase Auth |
| 12 | GET | `/api/casos/:id/turnos` | Turnos | Supabase Auth |
| 13 | PATCH | `/api/turnos/:id` | Turnos | Supabase Auth |
| 14 | GET | `/api/seguimientos` | Seguimientos | Supabase Auth |
| 15 | PATCH | `/api/seguimientos/:id` | Seguimientos | Supabase Auth |
| 16 | GET | `/api/metricas` | Métricas | Supabase Auth (admin) |
| 17 | GET | `/api/metricas/casos-por-tipo` | Métricas | Supabase Auth (admin) |
| 18 | GET | `/api/metricas/tiempos-resolucion` | Métricas | Supabase Auth (admin) |
| 19 | GET | `/api/usuarios` | Usuarios | Supabase Auth (admin) |
| 20 | GET | `/api/usuarios/:id` | Usuarios | Supabase Auth |
| 21 | PATCH | `/api/usuarios/:id` | Usuarios | Supabase Auth (admin) |
| 22 | POST | `/api/config/sync` | Config | Supabase Auth (admin) |
| 23 | GET | `/api/config` | Config | Supabase Auth |

---

## 2. Callbell Webhook

### 2.1 POST `/api/callbell/webhook`

Endpoint público que recibe eventos de Callbell CRM. No requiere autenticación de Supabase — se valida mediante firma HMAC.

**Headers:**

| Header | Valor | Obligatorio |
|---|---|---|
| `Content-Type` | `application/json` | ✅ Sí |
| `x-callbell-signature` | `HMAC_SHA256(payload, webhook_secret)` | ✅ Sí |

**Payload — Evento `message_created` (status: received):**

```json
{
  "event": "message_created",
  "conversation_uuid": "abc-123-def-456",
  "message": {
    "id": "msg_789",
    "text": "Hola, quiero turno para una ecografía abdominal",
    "status": "received",
    "attachments": [
      {
        "type": "image/jpeg",
        "url": "https://callbell-media.com/orden_medica.jpg",
        "name": "orden_medica.jpg"
      }
    ],
    "created_at": "2026-06-09T10:30:00Z"
  },
  "contact": {
    "name": "María Pérez",
    "phone": "5492915551234"
  },
  "channel": "whatsapp"
}
```

**Validaciones del payload:**

| Campo | Regla |
|---|---|
| `event` | Debe ser uno de: `message_created`, `conversation_opened`, `conversation_closed` |
| `conversation_uuid` | Obligatorio. Formato UUID v4 |
| `message.status` | Si es `message_created`, `status` debe ser `received` para procesar. Si es `sent`, ignorar |
| `contact.phone` | Obligatorio. Formato internacional sin `+` |
| `message.attachments` | Opcional. Si existe, cada attachment debe tener `type` y `url` |

**Respuestas:**

| Código | Condición | Body |
|---|---|---|
| `200 OK` | Webhook válido, caso creado o procesado | `{ "success": true, "caso_id": "LV-0041" }` |
| `200 OK` | Webhook duplicado (idempotencia) | `{ "success": true, "caso_id": "LV-0041", "duplicate": true }` |
| `200 OK` | Mensaje saliente ignorado (status = sent) | `{ "success": true, "ignored": true, "reason": "outgoing_message" }` |
| `401 Unauthorized` | Firma HMAC inválida | `{ "error": "invalid_signature" }` |
| `400 Bad Request` | Payload inválido | `{ "error": "invalid_payload", "details": ["campo x es requerido"] }` |

**Eventos adicionales que Callbell puede enviar:**

| Evento | Acción del backend |
|---|---|
| `conversation_opened` | Registrar en `casos.callbell_conversation_status = 'opened'` |
| `conversation_closed` | Si el caso sigue abierto en el sistema, registrar el cierre de Callbell |

**Idempotencia:**

El backend verifica si ya existe un caso con el mismo `conversation_uuid` + `message.id`. Si existe, responde `200` con `duplicate: true` sin procesar de nuevo.

---

## 3. Casos

### 3.1 GET `/api/casos`

Lista casos con filtros. Usado por el panel web para cargar la cola inicial.

**Query parameters:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `estado` | enum | ❌ No | Filtrar por estado: `pendiente`, `en_proceso`, `esperando_respuesta`, `cerrado` |
| `tipo_caso` | enum | ❌ No | Filtrar por tipo: `A`–`K` |
| `asesor_id` | UUID | ❌ No | Filtrar por asesor asignado. `null` = casos sin asignar |
| `prioridad` | enum | ❌ No | `urgente`, `normal`, `bajo` |
| `seguimiento_hoy` | boolean | ❌ No | Si `true`, solo casos con `seguimiento_fecha = today` |
| `search` | string | ❌ No | Búsqueda por nombre de paciente o teléfono |
| `page` | integer | ❌ No | Número de página. Default: 1 |
| `limit` | integer | ❌ No | Resultados por página. Default: 50. Max: 100 |
| `sort_by` | string | ❌ No | Campo de ordenamiento. Default: `created_at` |
| `sort_order` | enum | ❌ No | `asc` o `desc`. Default: `desc` |

> **Nota:** Los campos `resumen_ia`, `confianza_global`, `flags`, `practica` y `obra_social` en la respuesta provienen de la tabla `extraccion_ia` mediante JOIN. Es una vista denormalizada para la lista.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "LV-0041",
      "callbell_uuid": "abc-123",
      "contact_phone": "5492915551234",
      "contact_name": "María Pérez",
      "tipo_caso": "A",
      "estado": "pendiente",
      "prioridad": "normal",
      "asesor_id": null,
      "created_at": "2026-06-09T10:30:00Z",
      "updated_at": "2026-06-09T10:30:00Z",
      "resolved_at": null,
      "closing_reason": null,
      "seguimiento_fecha": null,
      "seguimiento_nota": null,
      "resumen_ia": "Paciente solicita turno para ecografía abdominal. Obra social IOMA.",
      "flags": ["ayuno"],
      "confianza_global": 0.91,
      "practica": "Ecografía abdominal",
      "obra_social": "IOMA"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 23,
    "total_pages": 1
  }
}
```

### 3.2 GET `/api/casos/:id`

Obtiene el detalle completo de un caso, incluyendo extracción IA, turnos, llamadas y eventos.

**Response `200 OK`:**

```json
{
  "id": "LV-0041",
  "callbell_uuid": "abc-123",
  "contact_phone": "5492915551234",
  "contact_name": "María Pérez",
  "tipo_caso": "A",
  "estado": "pendiente",
  "prioridad": "normal",
  "asesor_id": null,
  "asesor_nombre": null,
  "created_at": "2026-06-09T10:30:00Z",
  "updated_at": "2026-06-09T10:30:00Z",
  "resolved_at": null,
  "closing_reason": null,
  "seguimiento_fecha": null,
  "seguimiento_nota": null,
  "callbell_conversation_status": "opened",
  "extraccion_ia": {
    "paciente_nombre": "María Pérez",
    "paciente_dni": "30.123.456",
    "obra_social": "IOMA",
    "nro_afiliado": "AF-987654",
    "practica": "Ecografía abdominal",
    "tipo_practica": "ecografia",
    "medico_derivante": "Dr. Rodríguez",
    "matricula": "MP 12345",
    "diagnostico": "Dolor abdominal inespecífico",
    "motivo_solicitud": "screening",
    "requiere_copago": false,
    "requiere_llamada": false,
    "requiere_autorizacion": true,
    "flags": ["ayuno"],
    "confianza_global": 0.91,
    "orden_url": "https://callbell-media.com/orden_medica.jpg"
  },
  "turnos": [],
  "llamadas": [],
  "ultimos_eventos": [
    {
      "accion": "caso.creado",
      "asesor_id": null,
      "created_at": "2026-06-09T10:30:00Z"
    }
  ]
}
```

### 3.3 PATCH `/api/casos/:id`

Actualiza campos del caso. Solo se envían los campos a modificar.

**Request body:**

```json
{
  "asesor_id": "uuid-del-asesor",
  "prioridad": "urgente",
  "seguimiento_fecha": "2026-06-16",
  "seguimiento_nota": "Llamar al paciente para verificar cobertura de IOMA"
}
```

**Validaciones:**

| Campo | Regla |
|---|---|
| `asesor_id` | Debe ser un UUID válido de un usuario existente con rol `asesor` |
| `prioridad` | Debe ser `urgente`, `normal` o `bajo` |
| `seguimiento_fecha` | Debe ser una fecha en formato `YYYY-MM-DD`. No puede ser anterior a hoy |
| `seguimiento_nota` | Si se envía `seguimiento_fecha`, este campo es obligatorio. Máximo 500 caracteres |

**Response `200 OK`:** El objeto `caso` completo actualizado.

### 3.4 POST `/api/casos/:id/asignar`

Asigna un caso al asesor autenticado (tomar caso de la cola general).

**Request body:** Vacío (el asesor se obtiene del token JWT).

**Validaciones:**

| Regla |
|---|
| El caso no debe tener ya un `asesor_id` asignado |
| El asesor autenticado debe tener rol `asesor` |

**Response `200 OK`:**

```json
{
  "success": true,
  "caso_id": "LV-0041",
  "asesor_id": "uuid-del-asesor",
  "estado": "en_proceso"
}
```

### 3.5 POST `/api/casos/:id/enviar`

Envía un mensaje de respuesta al paciente a través de Callbell API y opcionalmente cierra el caso.

**Request body:**

```json
{
  "mensaje": "Hola María, te confirmamos tu turno para ecografía abdominal:\n\n📅 Fecha: 15/06/2026\n⏰ Hora: 10:30\n📍 Sede: Lavalle 11\n\n📋 Instrucciones:\n- Asistir en ayunas (6 horas)\n- Traer orden médica\n- Traer estudios previos\n\nSaludos, Instituto Lavalle 11",
  "cerrar": true,
  "closing_reason": "turno_asignado",
  "tipo_mensaje": "confirmacion_turno"
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `mensaje` | string | ✅ Sí | Texto del mensaje a enviar. Máximo 4096 caracteres |
| `cerrar` | boolean | ❌ No | Si `true`, cierra el caso después de enviar. Default: `false` |
| `closing_reason` | enum | ❌ No | Obligatorio si `cerrar = true`. Ver lista de closing reasons |
| `tipo_mensaje` | string | ❌ No | Clasificación interna: `confirmacion_turno`, `informacion_precios`, `derivacion_chiclana`, `cancelacion`, `consulta_general`, `otro` |

**Validaciones:**

| Regla |
|---|
| El caso no debe estar cerrado |
| Si `cerrar = true`, `closing_reason` es obligatorio |
| El `closing_reason` debe ser uno de los 12 valores definidos |

**Response `200 OK`:**

```json
{
  "success": true,
  "caso_id": "LV-0041",
  "estado": "cerrado",
  "closing_reason": "turno_asignado",
  "callbell_msg_id": "msg_callbell_987",
  "enviado_at": "2026-06-09T11:00:00Z"
}
```

### 3.6 POST `/api/casos/:id/llamada`

Registra una llamada realizada al paciente.

**Request body:**

```json
{
  "duracion_min": 8,
  "phone": "5492915551234"
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `duracion_min` | integer | ❌ No | Duración estimada en minutos. Entero positivo. Máximo 120 |
| `phone` | string | ✅ Sí | Número llamado. Formato internacional |

**Validaciones:**

| Regla |
|---|
| El caso no debe estar cerrado |
| `phone` debe ser un número válido con código de país |
| `duracion_min` debe ser entero entre 1 y 120 |

**Response `201 Created`:**

```json
{
  "success": true,
  "llamada_id": "uuid-llamada",
  "caso_id": "LV-0041",
  "asesor_id": "uuid-asesor",
  "phone": "5492915551234",
  "initiated_at": "2026-06-09T11:05:00Z",
  "duracion_min": 8
}
```

### 3.7 POST `/api/casos/:id/cerrar`

Cierra un caso con un closing reason y nota opcional.

**Request body:**

```json
{
  "closing_reason": "sin_resolucion",
  "nota": "El paciente no respondió. Se intentó llamar 2 veces sin éxito.",
  "seguimiento_fecha": "2026-06-16"
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `closing_reason` | enum | ✅ Sí | Uno de los 12 closing reasons |
| `nota` | string | ❌ No | Nota interna. Máximo 1000 caracteres |
| `seguimiento_fecha` | date | ❌ No | Si el closing reason es `presupuesto_pendiente` o `sin_resolucion`, este campo es obligatorio |

**Validaciones:**

| Regla |
|---|
| El caso no debe estar cerrado |
| `closing_reason` debe ser uno de los 12 valores válidos |
| Si `closing_reason` es `presupuesto_pendiente` o `sin_resolucion`, `seguimiento_fecha` es obligatorio y debe ser una fecha futura |

**Response `200 OK`:**

```json
{
  "success": true,
  "caso_id": "LV-0041",
  "estado": "cerrado",
  "closing_reason": "sin_resolucion",
  "resolved_at": "2026-06-09T11:10:00Z",
  "seguimiento_fecha": "2026-06-16"
}
```

### 3.8 POST `/api/casos/:id/reabrir`

Reabre un caso cerrado (por ejemplo, cuando el paciente responde después de un cierre o cuando se retoma un seguimiento).

**Request body:**

```json
{
  "motivo": "Paciente respondió después de 5 días"
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `motivo` | string | ❌ No | Razón de la reapertura. Máximo 500 caracteres |

**Validaciones:**

| Regla |
|---|
| El caso debe estar en estado `cerrado` |
| No se puede reabrir un caso cerrado hace más de 90 días |

**Response `200 OK`:**

```json
{
  "success": true,
  "caso_id": "LV-0041",
  "estado": "en_proceso",
  "reabierto_at": "2026-06-09T11:15:00Z"
}
```

### 3.9 GET `/api/casos/:id/historial`

Obtiene el historial completo de eventos de un caso (timeline de auditoría).

**Response `200 OK`:**

```json
{
  "caso_id": "LV-0041",
  "eventos": [
    {
      "accion": "caso.creado",
      "asesor_id": null,
      "detalle": { "callbell_uuid": "abc-123", "tipo_caso": "A", "confianza": 0.91 },
      "created_at": "2026-06-09T10:30:00Z"
    },
    {
      "accion": "caso.asignado",
      "asesor_id": "uuid-asesor",
      "detalle": { "asesor_id_anterior": null, "asesor_id_nuevo": "uuid-asesor" },
      "created_at": "2026-06-09T10:35:00Z"
    },
    {
      "accion": "caso.enviado",
      "asesor_id": "uuid-asesor",
      "detalle": { "tipo_mensaje": "confirmacion_turno", "callbell_msg_id": "msg_987" },
      "created_at": "2026-06-09T11:00:00Z"
    },
    {
      "accion": "caso.cerrado",
      "asesor_id": "uuid-asesor",
      "detalle": { "closing_reason": "turno_asignado" },
      "created_at": "2026-06-09T11:00:01Z"
    }
  ]
}
```

---

## 4. Turnos

### 4.1 POST `/api/casos/:id/turno`

Crea un nuevo turno para un caso.

> **Nota:** Este endpoint solo registra el turno en la base de datos. Para enviar la confirmación al paciente, invocar POST `/api/casos/:id/enviar` posteriormente con el mensaje generado desde el panel.


**Request body:**

```json
{
  "sede": "lavalle11",
  "fecha": "2026-06-15",
  "hora": "10:30",
  "instrucciones": ["ayuno_6hs", "traer_orden", "traer_estudios_previos", "token_ioma"]
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `sede` | enum | ✅ Sí | `lavalle11` o `chiclana` |
| `fecha` | date | ✅ Sí | Formato `YYYY-MM-DD`. Debe ser hoy o una fecha futura |
| `hora` | time | ✅ Sí | Formato `HH:MM`. Horario laboral 07:00–20:00 |
| `instrucciones` | string[] | ❌ No | Array de strings. Valores permitidos: `ayuno_6hs`, `ayuno_4hs`, `traer_orden`, `traer_estudios_previos`, `aines`, `token_ioma`, `con_acompaniante`, `sin_acompaniante`, `oro` |

**Validaciones:**

| Regla |
|---|
| El caso no debe estar cerrado |
| `sede` debe ser `lavalle11` o `chiclana` |
| `fecha` no puede ser anterior a hoy |
| `hora` debe estar entre 07:00 y 20:00 |
| Si el caso tiene flag `chiclana`, la sede debe ser `chiclana` automáticamente |

**Response `201 Created`:**

```json
{
  "success": true,
  "turno": {
    "id": "uuid-turno",
    "caso_id": "LV-0041",
    "sede": "lavalle11",
    "fecha": "2026-06-15",
    "hora": "10:30",
    "estado": "confirmado",
    "instrucciones": ["ayuno_6hs", "traer_orden", "traer_estudios_previos"],
    "confirmado_at": "2026-06-09T11:00:00Z"
  }
}
```

### 4.2 GET `/api/casos/:id/turnos`

Lista todos los turnos de un caso (incluye historial de reprogramaciones).

**Response `200 OK`:**

```json
{
  "caso_id": "LV-0041",
  "turnos": [
    {
      "id": "uuid-turno-1",
      "sede": "lavalle11",
      "fecha": "2026-06-10",
      "hora": "09:00",
      "estado": "reprogramado",
      "instrucciones": ["ayuno_6hs"],
      "confirmado_at": "2026-06-09T10:00:00Z"
    },
    {
      "id": "uuid-turno-2",
      "sede": "lavalle11",
      "fecha": "2026-06-15",
      "hora": "10:30",
      "estado": "confirmado",
      "instrucciones": ["ayuno_6hs", "traer_orden"],
      "confirmado_at": "2026-06-09T11:00:00Z"
    }
  ]
}
```

### 4.3 PATCH `/api/turnos/:id`

Actualiza un turno existente (usado para reprogramar).

**Request body:**

```json
{
  "fecha": "2026-06-18",
  "hora": "11:00",
  "instrucciones": ["ayuno_6hs"],
  "estado": "reprogramado"
}
```

**Validaciones:**

| Regla |
|---|
| No se puede modificar un turno cancelado |
| Si se cambia `fecha` u `hora`, el estado del turno anterior pasa a `reprogramado` y se crea uno nuevo con `confirmado` |
| `fecha` no puede ser anterior a hoy |

**Response `200 OK`:**

```json
{
  "success": true,
  "turno": {
    "id": "uuid-turno-2",
    "estado": "reprogramado",
    "reprogramado_at": "2026-06-09T11:30:00Z"
  },
  "nuevo_turno": {
    "id": "uuid-turno-3",
    "sede": "lavalle11",
    "fecha": "2026-06-18",
    "hora": "11:00",
    "estado": "confirmado",
    "confirmado_at": "2026-06-09T11:30:00Z"
  }
}
```

---

## 5. Seguimientos

### 5.1 GET `/api/seguimientos`

Lista casos con seguimiento pendiente. Filtro predeterminado: `seguimiento_fecha = today`. Usado por la vista "Seguimientos pendientes" del panel.

**Query parameters:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `fecha` | date | ❌ No | Fecha de seguimiento. Default: hoy (`YYYY-MM-DD`) |
| `estado` | enum | ❌ No | Filtrar por estado del caso. Default: todos menos `cerrado` |
| `page` | integer | ❌ No | Default: 1 |
| `limit` | integer | ❌ No | Default: 50 |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "LV-0035",
      "contact_name": "Juan López",
      "contact_phone": "5492915555678",
      "tipo_caso": "H",
      "estado": "esperando_respuesta",
      "prioridad": "urgente",
      "practica": "Punción de tiroides",
      "obra_social": "PAMI",
      "seguimiento_fecha": "2026-06-09",
      "seguimiento_nota": "Paciente debe aprobar presupuesto. Llamar para confirmar.",
      "created_at": "2026-06-02T09:00:00Z",
      "dias_desde_creacion": 7
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "total_pages": 1
  }
}
```

### 5.2 PATCH `/api/seguimientos/:caso_id`

Actualiza la nota de seguimiento y/o la fecha de seguimiento de un caso (atajo para no tener que usar PATCH `/api/casos/:id`).

**Request body:**

```json
{
  "seguimiento_fecha": "2026-06-20",
  "seguimiento_nota": "El presupuesto fue aprobado. Coordinar fecha de turno."
}
```

**Validaciones:**

| Regla |
|---|
| Si se envía `seguimiento_fecha`, debe ser una fecha futura |
| Si se envía `seguimiento_nota`, máximo 500 caracteres |
| Si se envía `seguimiento_fecha` sin `seguimiento_nota`, la nota anterior se mantiene |

**Response `200 OK`:** El objeto `caso` actualizado.

---

## 6. Métricas

### 6.1 GET `/api/metricas`

Tablero principal de métricas para el administrador. Devuelve KPIs agregados en tiempo real.

**Response `200 OK`:**

```json
{
  "resumen": {
    "casos_activos": 12,
    "casos_hoy": 8,
    "casos_sin_asignar": 5,
    "casos_sin_atender_24hs": 2,
    "tiempo_promedio_resolucion_min": 45,
    "tasa_resolucion_automatica": 0.15
  },
  "por_asesor": [
    {
      "asesor_id": "uuid-1",
      "nombre": "Franco Berardi",
      "casos_asignados": 4,
      "casos_resueltos_hoy": 3,
      "tiempo_promedio_min": 30
    }
  ],
  "por_tipo": [
    { "tipo": "A", "cantidad": 6, "nombre": "Turno estándar con orden" },
    { "tipo": "B", "cantidad": 3, "nombre": "Estudio sin turno" },
    { "tipo": "C", "cantidad": 2, "nombre": "Consulta de precios" },
    { "tipo": "H", "cantidad": 1, "nombre": "Punción/biopsia" }
  ],
  "volumen_por_dia": [
    { "fecha": "2026-06-07", "total": 20, "resueltos": 18, "automaticos": 3 },
    { "fecha": "2026-06-08", "total": 22, "resueltos": 20, "automaticos": 4 },
    { "fecha": "2026-06-09", "total": 8, "resueltos": 5, "automaticos": 1 }
  ],
  "practicas_mas_consultadas": [
    { "practica": "Ecografía abdominal", "cantidad": 15 },
    { "practica": "Radiografía de tórax", "cantidad": 10 },
    { "practica": "Mamografía bilateral", "cantidad": 7 }
  ],
  "casos_caidos": [
    { "caso_id": "LV-0020", "contact_name": "Ana Gómez", "created_at": "2026-05-15", "dias_sin_resolucion": 25 }
  ]
}
```

### 6.2 GET `/api/metricas/casos-por-tipo`

Métrica específica: distribución de casos activos por tipo.

**Query parameters:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `fecha_desde` | date | ❌ No | Inicio del rango. Default: 30 días atrás |
| `fecha_hasta` | date | ❌ No | Fin del rango. Default: hoy |

**Response `200 OK`:** Array de `{ tipo, nombre, cantidad, porcentaje }`.

### 6.3 GET `/api/metricas/tiempos-resolucion`

Métrica específica: tiempos promedio de resolución por práctica y por asesor.

**Query parameters:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `fecha_desde` | date | ❌ No | Default: 30 días atrás |
| `fecha_hasta` | date | ❌ No | Default: hoy |
| `agrupar_por` | enum | ❌ No | `practica` o `asesor`. Default: `practica` |

**Response `200 OK`:**

```json
{
  "agrupado_por": "practica",
  "datos": [
    { "grupo": "Ecografía abdominal", "promedio_min": 35, "min": 10, "max": 120, "muestras": 40 },
    { "grupo": "Radiografía de tórax", "promedio_min": 15, "min": 5, "max": 45, "muestras": 30 }
  ]
}
```

---

## 7. Usuarios

### 7.1 GET `/api/usuarios`

Lista todos los usuarios del sistema. Solo administradores.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "nombre": "Franco Berardi",
      "email": "franco@lavalle11.com",
      "rol": "administrador",
      "activo": true,
      "ultimo_acceso": "2026-06-09T09:00:00Z",
      "created_at": "2026-06-01T00:00:00Z"
    },
    {
      "id": "uuid-2",
      "nombre": "Brenda Gandolfi",
      "email": "brenda@lavalle11.com",
      "rol": "asesor",
      "activo": true,
      "ultimo_acceso": "2026-06-09T08:30:00Z",
      "created_at": "2026-06-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "total_pages": 1
  }
}
```

### 7.2 GET `/api/usuarios/:id`

Obtiene el detalle de un usuario. El asesor autenticado solo puede verse a sí mismo. El admin puede ver cualquier usuario.

**Response `200 OK`:** Objeto usuario.

### 7.3 PATCH `/api/usuarios/:id`

Actualiza un usuario. Solo administradores.

**Request body:**

```json
{
  "nombre": "Brenda Gandolfi",
  "rol": "asesor",
  "activo": true
}
```

**Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | string | ❌ No | Nombre completo. Máximo 150 caracteres |
| `rol` | enum | ❌ No | `asesor` o `administrador` |
| `activo` | boolean | ❌ No | Si `false`, el usuario no puede iniciar sesión |

**Validaciones:**

| Regla |
|---|
| El usuario autenticado debe tener rol `administrador` |
| No se puede cambiar el rol del último administrador activo del sistema |
| No se puede desactivar el propio usuario |

**Response `200 OK`:** El objeto `usuario` actualizado.

---

## 8. Configuración

### 8.1 GET `/api/config`

Obtiene la configuración actual del sistema (obras sociales, precios, catálogo de prácticas).

**Query parameters:**

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `clave` | string | ❌ No | Clave específica: `obras_sociales`, `precios`, `practicas_no_disponibles`. Si no se envía, devuelve todas |

**Response `200 OK`:**

```json
{
  "obras_sociales": [
    {
      "nombre": "IOMA",
      "requiere_copago": true,
      "monto_copago": 500,
      "requiere_llamada": false,
      "requiere_autorizacion": true,
      "codigo_femeba": "disponible",
      "notas": "Token obligatorio desde app IOMA"
    }
  ],
  "precios": [
    {
      "practica": "Ecografía abdominal",
      "precio_transferencia": 8000,
      "precio_efectivo": 7000,
      "vigencia": "Junio 2026"
    }
  ],
  "practicas_no_disponibles": [
    "Resonancia magnética",
    "Histerosalpingografía",
    "Electromiografía",
    "Polisomnografía",
    "Endoscopía alta",
    "Endoscopía baja",
    "Colonoscopía"
  ],
  "updated_at": "2026-06-09T10:00:00Z"
}
```

### 8.2 POST `/api/config/sync`

Fuerza la sincronización de Google Sheets (refresca el cache de configuración). Solo administradores.

**Request body:** Vacío.

**Response `200 OK`:**

```json
{
  "success": true,
  "sincronizado": {
    "obras_sociales": 15,
    "precios": 25,
    "errores": []
  },
  "synced_at": "2026-06-09T11:00:00Z"
}
```

---

## 9. Códigos de Error Generales

| Código | Significado |
|---|---|
| `400 Bad Request` | Payload inválido o validación fallida |
| `401 Unauthorized` | No autenticado (token faltante o inválido) |
| `403 Forbidden` | Autenticado pero sin permisos para la acción |
| `404 Not Found` | Recurso no encontrado |
| `409 Conflict` | Conflicto de estado (ej: caso ya cerrado) |
| `422 Unprocessable Entity` | Datos semánticamente inválidos (ej: fecha pasada) |
| `429 Too Many Requests` | Rate limit excedido |
| `500 Internal Server Error` | Error inesperado del servidor |

### Formato de errores

```json
{
  "error": "codigo_error",
  "message": "Descripción legible del error",
  "details": ["Campo 'fecha' es obligatorio", "Campo 'hora' debe estar entre 07:00 y 20:00"],
  "request_id": "uuid-debug"
}
```

---

## 10. Health Check

### 10.1 GET `/api/health`

Endpoint público de monitoreo. No requiere autenticación. Verifica que el backend y sus dependencias principales responden.

**Response `200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-09T11:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "supabase": "ok",
    "callbell": "ok"
  }
}
```

**Response `503 Service Unavailable`:**

```json
{
  "status": "degraded",
  "timestamp": "2026-06-09T11:00:00Z",
  "checks": {
    "supabase": "ok",
    "callbell": "error: timeout"
  }
}
```

---

## 11. Rate Limits
|---|---|---|
| `/api/callbell/webhook` | 60 requests | 1 minuto |
| `/api/casos`, `/api/casos/:id`, `/api/casos/:id/*` | 120 requests | 1 minuto |
| `/api/metricas`, `/api/metricas/*` | 30 requests | 1 minuto |
| `/api/config`, `/api/config/sync` | 20 requests | 1 minuto |
| `/api/usuarios`, `/api/usuarios/:id` | 20 requests | 1 minuto |
| `/api/health` | 60 requests | 1 minuto (sin autenticación) |

---

## 11. Resumen de Closing Reasons

| Valor | Cuándo se usa |
|---|---|
| `turno_asignado` | El asesor confirmó fecha, hora y sede |
| `turno_reprogramado` | Se modificó un turno existente |
| `turno_cancelado` | El paciente canceló su turno |
| `consulta_resuelta` | Consulta general respondida |
| `consulta_resuelta_portal` | Paciente accedió al portal de resultados |
| `esperando_respuesta` | Se respondió pero se aguarda decisión del paciente |
| `derivado_chiclana` | Medicina Nuclear derivada a Chiclana |
| `practica_no_disponible` | Estudio no se realiza en el instituto |
| `equivocado` | Paciente quería contactar otro centro |
| `error_datos_ris` | DNI u otro dato cargado incorrectamente |
| `presupuesto_pendiente` | Presupuesto de punción/biopsia en proceso |
| `sin_resolucion` | Caso no pudo resolverse |
