# UI SPEC — Especificación de la Interfaz de Usuario

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-09
>
> Este documento describe todas las pantallas del panel web, sus componentes, interacciones y reglas visuales.
> **No contiene código React** — es la especificación de diseño.

---

## 1. Mapa de Pantallas

```
Login ──▶ Dashboard (AppLayout)
              │
              ├──▶ Cola General (vista default)
              ├──▶ Mi Bandeja (filtro por asesor)
              ├──▶ Por Tipo (filtro dropdown)
              ├──▶ Por Estado (filtro dropdown)
              ├──▶ Seguimientos (vista filtrada)
              │
              ├──▶ Modal Caso (superposición)
              │       ├──▶ Visor de Orden Médica (sub-modal)
              │       └──▶ Confirmar Envío (sub-modal)
              │
              ├──▶ Dashboard Métricas (admin)
              └──▶ Historial de Caso (panel lateral)
```

### Roles y acceso

| Rol | Pantallas disponibles |
|---|---|
| **asesor** | Login, Cola General, Mi Bandeja, filtros, Modal Caso, Historial |
| **administrador** | Todo lo del asesor + Dashboard Métricas |

---

## 2. Layout General (AppLayout)

Estructura persistente en todas las pantallas excepto Login.

```
┌──────────────────────────────────────────────────────┐
│ HEADER                                               │
│ [Logo] Instituto Lavalle 11    Asesor: Brenda G. [↩] │
├──────────┬───────────────────────────────────────────┤
│ SIDEBAR  │  STATUS BAR                               │
│          │  ● Total: 12  ● Pendientes: 7  ● Míos: 3 │
│ ● Cola   ├───────────────────────────────────────────┤
│ ● Bandeja│  FILTER BAR                               │
│ ● Tipo   │  [Cola Gral] [Mi Bandeja] [Tipo ▼] [Est▼] │
│ ● Estado ├───────────────────────────────────────────┤
│ ● Seguim.│                                           │
│          │         CONTENT AREA                      │
│ [Métricas]│   (grid, modal o dashboard)              │
│ [Admin]  │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### 2.1 Header

| Elemento | Descripción | Interacción |
|---|---|---|
| **Logo** | Logotipo + nombre "Instituto Lavalle 11" | Link a raíz del panel |
| **Nombre del asesor** | Nombre del usuario autenticado | Tooltip con email y rol |
| **Botón de cierre sesión** | Icono de salida | Al hacer clic: confirmación → logout → redirige a Login |

### 2.2 Sidebar

| Elemento | Descripción | Comportamiento |
|---|---|---|
| **Cola General** | Todos los casos activos | Ícono activo si es la vista actual. Acceso directo |
| **Mi Bandeja** | Casos asignados al asesor | Muestra contador de casos activos en badge |
| **Por Tipo** | Expande submenú con tipos A–K | Cada tipo muestra su contador |
| **Por Estado** | Expande submenú: Pendiente, En Proceso, Esperando | Cada estado muestra su contador |
| **Seguimientos** | Casos con seguimiento para hoy | Badge rojo si hay pendientes |
| **Métricas** (admin) | Tablero de KPIs | Visible solo para rol administrador |
| **Separador visual** | Línea divisoria | — |
| **Versión** | "v1.0.0" al pie | Sin interacción |

**Comportamiento:** Al hacer clic en un item, se activa el filtro correspondiente y se actualiza el contenido. El item activo se marca con color de acento y barra lateral izquierda. La Filter Bar se sincroniza automáticamente: si el usuario hace clic en "Mi Bandeja" en la Sidebar, el botón "Mi Bandeja" en la Filter Bar también se activa, y viceversa.

### 2.3 Status Bar

| Elemento | Descripción |
|---|---|
| **Total** | Contador de casos activos (no cerrados). Color neutral |
| **Pendientes** | Casos en estado `pendiente`. Color naranja |
| **Míos** | Casos asignados al asesor autenticado. Color azul |

**Comportamiento:** Los contadores se actualizan en tiempo real vía Realtime. Al hacer clic en "Míos", se activa el filtro "Mi Bandeja".

### 2.4 Filter Bar

| Elemento | Tipo | Comportamiento |
|---|---|---|
| **Cola General** | Botón toggle | Muestra todos los casos activos. Es el default |
| **Mi Bandeja** | Botón toggle | Filtra por `asesor_id = auth.uid()` |
| **Por Tipo** | Dropdown | Menú desplegable con los 11 tipos. Al seleccionar uno, se activa |
| **Por Estado** | Dropdown | Menú con `pendiente`, `en_proceso`, `esperando_respuesta` |
| **Seguimientos** | Botón toggle | Filtra casos con `seguimiento_fecha = hoy`. Badge si hay |

**Reglas visuales:**
- El filtro activo tiene color de acento (azul) y subrayado
- Los filtros son mutuamente excluyentes (excepto Cola General que es el default)
- Los dropdowns se cierran al hacer clic fuera

---

## 3. Pantalla: Login

```
┌──────────────────────────────────────┐
│                                      │
│              ┌────┐                  │
│              │Logo│                  │
│              └────┘                  │
│    Instituto Lavalle 11              │
│   Panel de Gestión de Turnos         │
│                                      │
│   Correo electrónico                 │
│   ┌──────────────────────────────┐   │
│   │ franco@lavalle11.com         │   │
│   └──────────────────────────────┘   │
│                                      │
│   Contraseña                         │
│   ┌──────────────────────────────┐   │
│   │ •••••••••••            [👁]  │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │         Iniciar Sesión       │   │
│   └──────────────────────────────┘   │
│                                      │
│   ¿Olvidaste tu contraseña?          │
│                                      │
└──────────────────────────────────────┘
```

### 3.1 Componentes

| Componente | Descripción | Validación |
|---|---|---|
| **Campo email** | Input de texto con placeholder. Tipo `email` | Formato email válido. Si inválido: borde rojo + mensaje "Correo inválido" |
| **Campo contraseña** | Input de tipo `password` con toggle de visibilidad (icono ojo) | Mínimo 6 caracteres. Si vacío: borde rojo |
| **Botón "Iniciar Sesión"** | Botón primario, ancho completo | Deshabilitado si campos vacíos. Muestra spinner durante la carga |
| **Toggle visibilidad** | Icono de ojo al final del campo contraseña | Alterna entre `password` y `text` |
| **Link "¿Olvidaste tu contraseña?"** | Link de texto | Por ahora sin funcionalidad (fuera de alcance v1) |

### 3.2 Interacciones

| Evento | Comportamiento |
|---|---|
| Submit exitoso | Redirige a Dashboard (Cola General). Guarda sesión en localStorage |
| Credenciales inválidas | Mensaje de error inline: "Credenciales inválidas. Intentá de nuevo." Borde rojo en ambos campos |
| Error de red | Mensaje: "Error de conexión. Verificá tu internet." |
| Sesión activa al cargar | Si hay token JWT vigente, saltea Login y va directo a Dashboard |

### 3.3 Estados

| Estado | Visual |
|---|---|
| Default | Campos vacíos, botón deshabilitado |
| Cargando | Botón muestra spinner. Campos deshabilitados |
| Error | Mensaje de error debajo del botón. Borde rojo en campos |
| Éxito | Redirección inmediata |

---

## 4. Pantalla: Cola General

Vista principal del dashboard. Muestra la grilla de casos activos.

```
┌──────────────────────────────────────────────────────────────┐
│ [Cola General] [Mi Bandeja] [Tipo ▼] [Estado ▼] [Seguim.📌] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 🔴 LV-0041  │  │ 🟠 LV-0042  │  │ 🟢 LV-0043  │          │
│  │ María Pérez │  │ Juan López  │  │ Ana Gómez   │          │
│  │ Ecografía   │  │ RX tórax    │  │ PET CT      │          │
│  │ IOMA        │  │ OSDE        │  │ PAMI        │          │
│  │ hace 15 min │  │ hace 2 hs   │  │ hace 1 min  │          │
│  │ [Ayuno]     │  │             │  │ [Chiclana]  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ 🔴 LV-0044  │  │ 🟠 LV-0045  │                           │
│  │ ...         │  │ ...         │                           │
│  └─────────────┘  └─────────────┘                           │
│                                                              │
│                    [Cargar más...]                            │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Componente: CaseCard

Cada card representa un caso en la cola.

| Elemento | Descripción |
|---|---|
| **Indicador de prioridad** | Barra lateral izquierda: 🔴 rojo (urgente), 🟠 naranja (normal), 🟢 verde (bajo) |
| **ID del caso** | `LV-0041` en fuente monoespaciada |
| **Nombre del paciente** | Texto semibold. Si es contacto recurrente: icono 🔄 al lado |
| **Práctica solicitada** | Texto secundario |
| **Obra social** | Texto secundario con badge de color (IOMA = azul, PAMI = rojo, Particular = gris) |
| **Tiempo de espera** | Texto en gris. Si > 2 horas: color naranja. Si > 4 horas: color rojo |
| **Tags de flags** | Badges pequeños: [Ayuno], [Copago], [Chiclana], [Baja Confianza], [Token IOMA] |
| **Resumen IA** | Texto en una línea con ellipsis al final si es muy largo |
| **Hover** | Sutil elevación (sombra). Cursor pointer |

**Interacciones:**

| Evento | Comportamiento |
|---|---|
| Click en card | Abre el Modal de Caso |
| Click en badge Chiclana | Filtra por tipo E |
| Doble click en nombre | Abre historial del contacto |

**Estados de la card:**

| Estado | Visual |
|---|---|
| **pendiente** | Barra de prioridad según clasificación |
| **en_proceso** | Borde sutil azul. Badge "En proceso" |
| **esperando_respuesta** | Borde amarillo punteado. Badge "Esperando" |
| **cerrado** | No aparece en cola general |

### 4.2 CaseGrid (grilla)

| Breakpoint | Columnas |
|---|---|
| ≥ 1200px (desktop) | 3 columnas |
| 768px – 1199px (tablet) | 2 columnas |
| < 768px (mobile) | 1 columna |

**Ordenamiento:** Por prioridad (urgente primero) + tiempo de espera (más antiguo primero).

**Carga infinita:** Scroll vertical. Al llegar al final, carga 20 cards más. Indicador de carga al pie.

**Vacío:** Si no hay casos activos: ilustración + mensaje "No hay casos pendientes. Todo al día."

---

## 5. Pantalla: Mi Bandeja

Misma estructura que Cola General, pero filtrada por `asesor_id = usuario actual`.

**Diferencias vs Cola General:**

| Aspecto | Diferencia |
|---|---|
| Título de vista | "Mi Bandeja" |
| Contador extra | "3 casos asignados" |
| Botón "Tomar caso" en cards sin asignar | Aparece en cards que el asesor puede tomar |
| Acción rápida | Al hacer clic en "Tomar caso": asigna el caso al asesor, sin abrir modal |

**Estado vacío:** Ilustración + mensaje "No tenés casos asignados. Tomá casos de la cola general." + botón "Ir a Cola General".

**Comportamiento de "Tomar caso":**

```
Click en "Tomar caso"
  → PATCH /api/casos/:id/asignar
  → Card cambia a estado "en_proceso" con borde azul
  → Badge "En proceso" aparece
  → Contador de "Míos" se incrementa en la Status Bar
```

---

## 6. Pantalla: Modal de Caso

Superposición modal que se abre al hacer clic en una card. Es la pantalla principal de trabajo del asesor.

```
┌─────────────────────────────────────────────────────────────┐
│ [X] Cerrar                           Caso LV-0041 · Tipo A │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─── Resumen IA ─────────────────────────────────────────┐  │
│ │ Paciente solicita turno para ecografía abdominal.      │  │
│ │ Obra social IOMA. Orden médica completa del Dr.        │  │
│ │ Rodríguez. Diagnóstico: Dolor abdominal inespecífico.  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─── Campos Extraídos ──────────────────────────────────┐  │
│ │ Nombre:    María Pérez              ✅ 95%            │  │
│ │ DNI:       30.123.456               ✅ 95%            │  │
│ │ Práctica:  Ecografía abdominal      ✅ 92%            │  │
│ │ Médico:    Dr. Rodríguez            ✅ 88%            │  │
│ │ Diagnóstico: Dolor abdominal        ⚠️ 65% - BAJO   │  │
│ │ Obra Social: IOMA                   ✅ 90%            │  │
│ │ Afiliado:  AF-987654                ❓ No extraído    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ [Ver Orden Médica 📷]                                       │
│                                                             │
│ ┌─── Datos del Turno ────────────────────────────────────┐  │
│ │ Sede:     [Lavalle 11 ▼]                               │  │
│ │ Fecha:    [15/06/2026]  Hora: [10:30]                 │  │
│ │ Cobertura: ✅ Verificada · Copago: No · Autorización: Sí │  │
│ │                                                         │  │
│ │ Instrucciones:                                          │  │
│ │ ☑ Ayuno (6 horas)    ☐ AINES                          │  │
│ │ ☑ Traer orden        ☐ Traer estudios previos         │  │
│ │ ☑ Token IOMA         ☐ Otro: [______________]         │  │
│ │                                                         │  │
│ │ ┌─── Vista Previa del Mensaje ──────────────────────┐  │  │
│ │ │ Hola María, te confirmamos tu turno para          │  │  │
│ │ │ ecografía abdominal:                              │  │  │
│ │ │ 📅 Fecha: 15/06/2026                              │  │  │
│ │ │ ⏰ Hora: 10:30                                    │  │  │
│ │ │ 📍 Sede: Lavalle 11                               │  │  │
│ │ │ ⚠️ Recordatorio: IOMA - No olvides tu TOKEN...    │  │  │
│ │ └───────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─── Acciones ──────────────────────────────────────────┐  │
│ │ [📞 Llamar al 291 555-1234]  [📝 Nota Interna]       │  │
│ │                                                       │  │
│ │ [✕ Cerrar sin resolver]  [✅ Confirmar y Enviar]      │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.1 Banner de Resumen IA

| Elemento | Descripción |
|---|---|
| **Texto del resumen** | Párrafo de 1–3 líneas generado por Claude |
| **Score de confianza** | Indicador visual: barra de progreso circular (verde > 0.8, amarillo 0.5–0.8, rojo < 0.5) |
| **Tipo de caso** | Badge con tipo (A–K) y nombre descriptivo |

### 6.2 Tabla de Campos Extraídos

| Elemento | Comportamiento |
|---|---|
| **Campo** | Nombre del campo |
| **Valor** | Texto extraído. Si está vacío: `❓ No extraído` en gris |
| **Confianza** | Porcentaje + icono: ✅ > 0.8, ⚠️ 0.5–0.8, ❌ < 0.5 |
| **Campos editables** | Al hacer clic en un valor, se convierte en input editable |

**Regla visual:** Los campos con confianza < 0.7 tienen fondo amarillo claro y borde izquierdo amarillo. El asesor puede corregirlos manualmente.

### 6.3 Visor de Orden Médica

Se abre como un sub-modal al hacer clic en "Ver Orden Médica".

```
┌──────────────────────────────────────────────────────────┐
│ Orden Médica · Caso LV-0041                     [✕ Cerrar]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐      │
│  │                                                │      │
│  │           [IMAGEN DE LA ORDEN MÉDICA]           │      │
│  │           (100% del ancho del modal)            │      │
│  │                                                │      │
│  └────────────────────────────────────────────────┘      │
│                                                           │
│  🔍 Zoom: [−] ████████████ 100% [+] │ ⬇ Descargar       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

| Elemento | Interacción |
|---|---|
| **Imagen** | Carga progresiva. Mientras carga: rectángulo gris con icono de imagen y spinner. Si falla: rectángulo con icono roto + mensaje "No se pudo cargar la imagen. Abrir en Callbell." + botón de enlace directo a la URL de Callbell. Si es PDF: vista previa de primera página |
| **Zoom** | Control deslizante 50%–200%. Scroll con rueda del mouse sobre la imagen |
| **Descargar** | Abre la imagen/PDF en nueva pestaña |
| **Cerrar** | Click fuera del modal o botón ✕ |

### 6.4 Formulario de Turno

| Elemento | Tipo | Comportamiento |
|---|---|---|
| **Sede** | Select dropdown | Opciones: Lavalle 11, Chiclana. Si el caso tiene flag CHICLANA, preselecciona Chiclana y bloquea el campo |
| **Fecha** | Date input | Datepicker. Mínimo: hoy |
| **Hora** | Time input | Step 30 min. Rango 07:00–20:00 |
| **Cobertura** | Badge informativo | Color según estado: verde (verificada), naranja (pendiente), gris (particular) |
| **Copago** | Badge informativo | Si `requiere_copago = true`: muestra monto + botón "Copago pendiente" |
| **Instrucciones** | Checkboxes | Cada checkbox activa/desactiva una línea en la vista previa del mensaje |

**Checkboxes de instrucciones disponibles:**

| Checkbox | Texto en mensaje |
|---|---|
| Ayuno (6 horas) | "Asistir en ayunas (6 horas)" |
| Ayuno (4 horas) | "Asistir en ayunas (4 horas)" |
| Traer orden médica | "Traer orden médica" |
| Traer estudios previos | "Traer estudios previos" |
| No AINES | "No tomar AINES 24 horas antes" |
| Token IOMA | "⚠️ Recordatorio: IOMA - No olvides tu TOKEN de la app" |
| Con acompañante | "Asistir con acompañante" |
| Sin acompañante | "Asistir sin acompañante" |
| Otro | Input texto libre. Se agrega como ítem adicional |

**Regla:** Si `obra_social = IOMA`, el checkbox "Token IOMA" aparece automáticamente marcado.

### 6.5 Vista Previa del Mensaje

Generación en tiempo real. Se actualiza automáticamente al cambiar cualquier campo del formulario.

```
┌─── Vista Previa del Mensaje ──────────────────────────┐
│                                                        │
│ Hola María, te confirmamos tu turno para                │
│ ecografía abdominal:                                    │
│                                                        │
│ 📅 Fecha: 15/06/2026                                   │
│ ⏰ Hora: 10:30                                         │
│ 📍 Sede: Lavalle 11                                    │
│                                                        │
│ 📋 Instrucciones:                                      │
│ • Asistir en ayunas (6 horas)                          │
│ • Traer orden médica                                   │
│ • Traer estudios previos                               │
│                                                        │
│ ⚠️ Recordatorio: IOMA - No olvides tu TOKEN de la app  │
│                                                        │
│ Saludos, Instituto Lavalle 11                           │
└────────────────────────────────────────────────────────┘
```

| Elemento | Comportamiento |
|---|---|
| **Área de vista previa** | Fondo gris claro, texto formateado similar a WhatsApp |
| **Actualización** | Se regenera al cambiar cualquier campo (debounced 300ms) |
| **Edición manual** | El asesor puede tocar el texto y editarlo directamente |
| **Copiar** | Botón "Copiar mensaje" que copia al portapapeles |

### 6.6 Acciones

| Botón | Color | Comportamiento |
|---|---|---|
| **Llamar al paciente** | Verde | Abre `wa.me/5492915551234` en nueva pestaña |
| **Nota interna** | Gris | Abre campo de texto expandible con selector de fecha de seguimiento |
| **Cerrar sin resolver** | Rojo outline | Abre sub-modal de confirmación con selector de closing reason + nota obligatoria |
| **Confirmar y Enviar** | Azul primario | Disparador principal. Abre sub-modal de confirmación |

**Sub-modal "Confirmar y Enviar":**

```
┌────────────────────────────────────────┐
│ Confirmar envío                        │
│                                        │
│ Se enviará el siguiente mensaje a      │
│ María Pérez (291 555-1234):            │
│                                        │
│ ┌─ Mensaje (resumido) ──────────────┐ │
│ │ "Hola María, te confirmamos..."   │ │
│ └───────────────────────────────────┘ │
│                                        │
│ [◉] Cerrar caso después de enviar      │
│ [  ] No cerrar (esperar respuesta)     │
│                                        │
│ Closing reason: [Turno asignado ▼]     │
│                                        │
│ [Cancelar]          [✅ Enviar]        │
└────────────────────────────────────────┘
```

### 6.7 Estados del Modal

| Estado | Comportamiento |
|---|---|
| **Cargando** | Skeleton loader mientras se obtienen datos del caso |
| **Error** | Mensaje "Error al cargar el caso. Intentá de nuevo." + botón de reintentar |
| **Envío exitoso** | Toast verde "Mensaje enviado correctamente" + cierre del modal |
| **Error de envío** | Toast rojo "Error al enviar. Reintentando..." + botón "Reintentar ahora" |

---

## 7. Pantalla: Seguimientos

Vista filtrada que muestra casos con seguimiento programado.

```
┌──────────────────────────────────────────────────────────────┐
│ Seguimientos Pendientes                                      │
│                                                              │
│ Fecha: [09/06/2026 ▼]                                        │
│                                                              │
│ ┌─────────────┬──────────┬──────────┬───────────┬─────────┐ │
│ │   ID        │ Paciente │ Práctica │   Estado  │  Desde  │ │
│ ├─────────────┼──────────┼──────────┼───────────┼─────────┤ │
│ │ 🔴 LV-0035 │ J. López │ Punción  │ Esperando │ 7 días  │ │
│ │             │          │ tiroides │ respuesta │         │ │
│ │             │          │          │           │         │ │
│ │ Nota: Paciente debe aprobar presupuesto. Llamar.         │ │
│ │                                     [📝 Editar] [Abrir] │ │
│ ├─────────────┼──────────┼──────────┼───────────┼─────────┤ │
│ │ 🟠 LV-0028 │ A. Ruiz  │ Mamograf.│ Pendiente │ 3 días  │ │
│ │             │          │          │           │         │ │
│ │ Nota: Verificar cobertura PAMI.                          │ │
│ │                                     [📝 Editar] [Abrir] │ │
│ └─────────────┴──────────┴──────────┴───────────┴─────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 7.1 Componentes

| Elemento | Descripción | Interacción |
|---|---|---|
| **Selector de fecha** | Date input con botón "Hoy" | Default: hoy. Al cambiar: actualiza la lista |
| **Tabla de seguimientos** | Formato tabla. Cada fila es un caso con seguimiento | Filas clickeables |
| **Columna ID** | ID con indicador de prioridad | Click → abre Modal Caso |
| **Columna Nota** | Texto de la nota interna. Truncado a 2 líneas | Hover: muestra nota completa en tooltip |
| **Botón Editar** | Icono lápiz | Abre inline editor de nota + fecha |
| **Botón Abrir** | Icono de flecha | Abre Modal Caso |
| **Casilla vacía** | Cuando no hay seguimientos | Mensaje "No hay seguimientos pendientes para hoy" |

### 7.2 Inline Editor de Seguimiento

Al hacer clic en "Editar", se expande un campo inline debajo de la fila:

```
├─────────────┼──────────┼──────────┼───────────┼─────────┤
│ LV-0035     │ J. López │ Punción  │ Esperando │ 7 días  │
│             │          │ tiroides │ respuesta │         │
├─────────────┴──────────┴──────────┴───────────┴─────────┤
│ Nueva nota: [_____________________________________]     │
│ Nueva fecha de seguimiento: [16/06/2026]                │
│                                              [💾 Guardar]│
└──────────────────────────────────────────────────────────┘
```

---

## 8. Pantalla: Dashboard de Métricas (Admin)

Vista exclusiva para administradores. Muestra KPIs operativos.

```
┌──────────────────────────────────────────────────────────────┐
│ Dashboard · Métricas Operativas                 [📥 Exportar]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐             │
│ │Casos │ │ Hoy  │ │Sin   │ │Tpo   │ │Tasa    │             │
│ │Activos│ │      │ │Asig. │ │Prom. │ │Auto.   │             │
│ │  12   │ │  8   │ │  5   │ │ 45m  │ │  15%   │             │
│ └──────┘ └──────┘ └──────┘ └──────┘ └────────┘             │
│                                                              │
│ ┌─── Casos por Tipo ───────────┐ ┌─── Volumen Diario ────┐ │
│ │                              │ │                        │ │
│ │ A: Turno con orden  ███ 6   │ │ │                     │ │
│ │ B: Automático       ██  3   │ │ │  ██ ███ ████ ██     │ │
│ │ C: Precios          █   2   │ │ │  07  08  09  10 11  │ │
│ │ H: Biopsia          █   1   │ │ │                      │ │
│ │                              │ │  Resueltos: 43/50      │ │
│ └──────────────────────────────┘ └────────────────────────┘ │
│                                                              │
│ ┌─── Tiempo Promedio por Práctica ──────────────────────────┐│
│ │                                                            ││
│ │ Ecografía abdominal    ████████████████████ 35 min         ││
│ │ Radiografía de tórax   ████████ 15 min                     ││
│ │ Mamografía             ██████████████ 25 min               ││
│ │ PET CT                 ████████████████████████ 50 min     ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─── Casos Caídos / Sin Resolución ─────────────────────────┐│
│ │ LV-0020 · Ana Gómez    · hace 25 días · [Ver]            ││
│ │ LV-0015 · Pedro Díaz   · hace 18 días · [Ver]            ││
│ └────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 8.1 Componentes

| Componente | Descripción | Datos |
|---|---|---|
| **KPIs cards** | 5 tarjetas con métricas principales | Casos activos, hoy, sin asignar, tiempo promedio, tasa automática |
| **Gráfico "Casos por Tipo"** | Barras horizontales con cantidad | Label + barra + número |
| **Gráfico "Volumen Diario"** | Barras verticales de los últimos 7 días | Barra apilada: resueltos (verde) + pendientes (naranja) |
| **Tabla "Tiempo por Práctica"** | Barras horizontales con min | Promedio, mínimo, máximo |
| **Tabla "Casos Caídos"** | Lista de casos sin resolver > 7 días | ID, nombre, días, botón "Ver" que abre el caso |

### 8.2 Interacciones

| Elemento | Comportamiento |
|---|---|
| **Click en barra de tipo** | Filtra la cola general por ese tipo |
| **Click en "Ver" de caso caído** | Abre Modal Caso |
| **Exportar** | Descarga CSV con métricas del período visible |
| **Selector de período** | Filtro de fechas para todos los gráficos |

**Estado vacío (sin datos):** Si es el primer día de operación o no hay datos en el período: Ilustración + mensaje "No hay datos suficientes para mostrar métricas. Los datos aparecerán a medida que se procesen casos."

---

## 9. Pantalla: Historial de Caso

Panel lateral que se abre desde el Modal Caso o desde el indicador de contacto recurrente.

```
┌────────────────────────────────────────────┐
│ Historial · 📞 291 555-1234       [✕]     │
│ María Pérez                                │
├────────────────────────────────────────────┤
│                                            │
│ ┌─── LV-0041 · Hoy ─────────────────────┐ │
│ │ Ecografía abdominal · IOMA            │ │
│ │ Estado: en_proceso                    │ │
│ │ Turno: 15/06/2026 10:30 Lavalle 11   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─── LV-0020 · Hace 3 meses ────────────┐ │
│ │ Mamografía bilateral · OSDE           │ │
│ │ Estado: cerrado (turno asignado)      │ │
│ │ Turno: 10/03/2026 09:00 Lavalle 11   │ │
│ │                                        │ │
│ │ 📋 Nota: Paciente llegó tarde, se     │ │
│ │ reprogramó para la semana siguiente.  │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─── LV-0015 · Hace 9 meses ────────────┐ │
│ │ RX tórax · IOMA · Tipo B (automático) │ │
│ │ Estado: cerrado (consulta resuelta)   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│         [Ver todos los casos →]            │
└────────────────────────────────────────────┘
```

### 9.1 Componentes

| Elemento | Descripción |
|---|---|
| **Encabezado** | Nombre + teléfono. Icono de teléfono |
| **Lista de casos previos** | Ordenados del más reciente al más antiguo |
| **Card de caso previo** | ID, práctica, obra social, estado, fecha del turno, nota interna si existe |
| **Tipo B** | Badge "Automático" en casos resueltos sin intervención |
| **Link "Ver todos"** | Expande para mostrar todos los casos (no solo los últimos 3) |

---

## 10. Componentes Transversales

### 10.1 Toast / Notificaciones

| Tipo | Icono | Color | Duración | Acción |
|---|---|---|---|---|
| Éxito | ✅ | Verde | 3 seg | Ninguna |
| Error | ❌ | Rojo | Persiste | Botón "Cerrar" + a veces "Reintentar" |
| Advertencia | ⚠️ | Amarillo | 5 seg | Ninguna |
| Info | ℹ️ | Azul | 4 seg | Ninguna |

### 10.2 Skeleton Loader

| Componente | Forma del skeleton |
|---|---|
| CaseCard | Rectángulo con líneas de texto simuladas |
| Modal de caso | Rectángulos para cada sección del formulario |
| Tabla de seguimientos | Filas con celdas de ancho variable |
| Métricas | Tarjetas con números simulados |

### 10.3 Badges y Tags

| Badge | Color | Significado |
|---|---|---|
| 🔴 Urgente | Rojo | Flag crítico activo |
| 🟠 Normal | Naranja | Pendiente de verificación |
| 🟢 Bajo | Verde | Listo para asignar |
| 🔄 Recurrente | Azul | Contacto con historial previo |
| [Ayuno] | Celeste | Requiere ayuno |
| [Copago] | Naranja | Requiere copago |
| [Chiclana] | Violeta | Derivación a Chiclana |
| [Token IOMA] | Azul | Recordatorio de token |
| [Baja Confianza] | Amarillo | Extracción IA < 0.7 |
| [Automático] | Gris | Caso resuelto sin asesor |

### 10.4 Tooltips

| Elemento | Contenido del tooltip |
|---|---|
| Badge de confianza | "Confianza: 65%. Campos: diagnóstico, afiliado" |
| Indicador recurrente | "Contacto recurrente. 2 casos previos" |
| Botón deshabilitado | "Completá sede, fecha y hora para habilitar" |
| ID del caso | "Creado: 09/06/2026 10:30 hs" |

---

## 11. Flujos de Interacción Complejos

### 11.1 Flujo: Asignar y resolver caso

> **Nota:** Al abrir el modal, si el caso no tiene asesor asignado, se asigna automáticamente al asesor que lo abrió (PATCH /api/casos/:id/asignar). Esto actualiza la card en tiempo real para todos los conectados.

```
1. Asesor ve card en Cola General
2. Hace clic → se abre Modal Caso
3. Si el caso no tiene asesor, se asigna automáticamente al asesor que lo abrió
4. Modal carga datos (GET /api/casos/:id)
4. Asesor revisa resumen IA y campos extraídos
5. Verifica orden médica en visor
6. Selecciona sede, fecha, hora
7. Marca checkboxes de instrucciones
8. Revisa vista previa del mensaje (se actualiza en vivo)
9. Hace clic en "Confirmar y Enviar"
10. Sub-modal de confirmación
11. Confirma → POST /api/casos/:id/enviar + POST /api/casos/:id/turno
12. Toast de éxito, modal se cierra, card desaparece de la cola
```

### 11.2 Flujo: Llamada + resolución

```
1. Asesor abre Modal Caso
2. Ve flag "Requiere llamada"
3. Hace clic en "Llamar al paciente"
4. Se abre wa.me/ en nueva pestaña
5. Asesor llama y habla con el paciente
6. Vuelve al modal, ingresa duración de llamada
7. Confirma el turno y envía mensaje
8. POST /api/casos/:id/llamada + POST /api/casos/:id/enviar
9. Caso se cierra
```

### 11.3 Flujo: Caso automático (Tipo B)

```
(El asesor nunca ve este flujo en el panel)
1. Mensaje entrante → webhook → Claude detecta Tipo B
2. Backend genera respuesta automática
3. Backend envía mensaje vía Callbell API
4. Backend cierra caso
5. Caso queda registrado en BD pero NO aparece como card
6. Solo visible en métricas y reportes
```

### 11.4 Flujo: Derivación a Chiclana (Tipo E)

```
1. Asesor abre Modal Caso con flag CHICLANA
2. La sede se preselecciona como "Chiclana" y se bloquea
3. Asesor verifica datos
4. Hace clic en "Confirmar y Enviar"
5. Backend: notifica a Chiclana + envía mensaje al paciente
6. Caso se cierra con closing_reason = "derivado_chiclana"
```

---

## 12. Diseño Responsivo

| Breakpoint | Comportamiento |
|---|---|
| **Desktop (≥ 1200px)** | Layout completo: sidebar visible, 3 columnas de cards, modal centrado |
| **Tablet (768–1199px)** | Sidebar colapsable (iconos sin texto), 2 columnas de cards, modal ocupa 80% del ancho |
| **Mobile (< 768px)** | Sidebar oculto (menú hamburguesa), 1 columna de cards, modal ocupa 100% del ancho, status bar simplificada |

---

## 13. Animaciones y Transiciones

| Elemento | Animación | Duración |
|---|---|---|
| Card aparece en grilla | Fade in + slide up | 200ms |
| Card se cierra/elimina | Fade out + slide right | 200ms |
| Modal se abre | Scale up desde el centro + backdrop fade | 250ms |
| Modal se cierra | Scale down + backdrop fade | 200ms |
| Toast aparece | Slide in desde arriba | 300ms |
| Vista previa se actualiza | Transición suave de opacidad | 150ms |
| Sidebar items | Hover: color de fondo | 100ms |
| Sub-modal | Overlay + scale | 200ms |
