# Requerimientos del Sistema

> Este documento lista los requerimientos funcionales (RF) y no funcionales (RNF) del sistema.
> Extraídos del PRD y del análisis arquitectónico.

---

## Requerimientos Funcionales

### Gestión de Conversaciones

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-01** | El sistema debe exponer un endpoint `POST /api/callbell/webhook` que reciba eventos de Callbell | Alta |
| **RF-02** | El sistema debe validar la firma del webhook de Callbell en cada request | Alta |
| **RF-03** | El sistema debe procesar eventos `message_created` con `status = received` (mensaje entrante del paciente) | Alta |
| **RF-04** | El sistema debe analizar el historial completo de la conversación, no solo el último mensaje | Alta |
| **RF-05** | El sistema debe procesar eventos `conversation_opened` y `conversation_closed` | Media |

### Análisis con IA

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-06** | El sistema debe enviar a Claude API: texto, adjuntos en base64, historial, catálogo de prácticas, tabla de obras sociales | Alta |
| **RF-07** | El sistema debe extraer: nombre del paciente, DNI, obra social, Nº afiliado, Nº carnet, práctica, tipo, médico derivante, matrícula, diagnóstico, motivo | Alta |
| **RF-08** | El sistema debe detectar flags de preparación (ayuno, AINES, etc.) desde la orden médica | Alta |
| **RF-09** | El sistema debe asignar un score de confianza global (0–1) a la extracción | Alta |
| **RF-10** | El sistema debe clasificar el caso en uno de los 11 tipos (A–K) | Alta |
| **RF-11** | El sistema debe detectar prácticas no realizadas y generar respuesta automática informativa | Alta |

### Panel Web

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-12** | El panel debe mostrar cards en una grilla con: ID (LV-XXXX), nombre, práctica, obra social, tiempo de espera, resumen IA, tags de flags, prioridad | Alta |
| **RF-13** | El panel debe actualizarse en tiempo real sin polling vía Supabase Realtime | Alta |
| **RF-14** | El panel debe ofrecer 5 vistas de filtro: cola general, mi bandeja, por tipo, por estado, seguimientos | Alta |
| **RF-15** | El modal de caso debe mostrar: resumen IA expandido, orden médica (visor), baja confianza resaltado, selector de sede, cobertura, fecha/hora, instrucciones, vista previa del mensaje, botón de llamada, nota interna | Alta |
| **RF-16** | El panel debe generar la vista previa del mensaje WhatsApp en tiempo real mientras el asesor completa los campos | Alta |

### Acciones del Asesor

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-17** | El asesor puede confirmar un turno → el sistema envía mensaje vía Callbell API y cierra el caso | Alta |
| **RF-18** | El sistema debe ejecutar resolución automática para Tipo B sin crear card | Alta |
| **RF-19** | El sistema debe notificar a la sede Chiclana vía WhatsApp cuando se deriva un caso de Medicina Nuclear | Alta |
| **RF-20** | El asesor puede registrar una llamada con duración estimada | Alta |
| **RF-21** | El asesor puede agregar notas internas con fecha de seguimiento obligatoria | Alta |

### Reglas de Negocio

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-22** | El sistema debe consultar Google Sheets en tiempo real para obras sociales (copago, llamada, autorización, código FEMEBA) | Alta |
| **RF-23** | El sistema debe consultar Google Sheets para precios (transferencia y efectivo) | Alta |
| **RF-24** | El sistema debe incluir advertencia de TOKEN IOMA en confirmaciones para pacientes de IOMA | Alta |
| **RF-25** | El sistema debe aplicar la regla de "sin informe escrito" para radiografías de traumatólogos | Alta |
| **RF-26** | El sistema debe reconocer contactos recurrentes por número de teléfono y mostrar historial | Alta |

### Administración

| ID | Descripción | Prioridad |
|---|---|---|
| **RF-27** | El administrador debe ver métricas: casos activos por tipo/asesor, tiempo promedio de resolución, casos sin atender > X horas, volumen, prácticas más consultadas, casos caídos | Alta |
| **RF-28** | El administrador debe poder gestionar usuarios (alta/baja de asesores) | Media |

---

## Requerimientos No Funcionales

| ID | Categoría | Requerimiento | Objetivo |
|---|---|---|---|
| **RNF-01** | Rendimiento | El análisis IA debe completarse en < 10 segundos para el 90% de los casos | 10s p95 |
| **RNF-02** | Rendimiento | Las cards deben aparecer en el panel en < 2 segundos desde el webhook | 2s |
| **RNF-03** | Escalabilidad | El sistema debe soportar picos de 80+ mensajes/día con posibilidad de crecimiento 3x | 240 msg/día |
| **RNF-04** | Disponibilidad | El backend debe tener uptime ≥ 99.9% (SLA de Vercel Pro) | 99.9% |
| **RNF-05** | Seguridad | API keys de Anthropic y Callbell solo en variables de entorno del backend | — |
| **RNF-06** | Seguridad | Supabase RLS: cada asesor solo ve y modifica sus casos autorizados | — |
| **RNF-07** | Privacidad | Datos de pacientes no se envían a terceros fuera de Callbell y Anthropic | — |
| **RNF-08** | Mantenibilidad | Google Sheets como fuente de verdad de configuración, editable sin deploy | — |
| **RNF-09** | UX | El panel debe ser responsivo en Chrome, Edge, Firefox | — |
| **RNF-10** | Costo | El costo de Claude API debe ser predecible y monitoreable | — |
| **RNF-11** | Trazabilidad | Cada acción registrada con: ID de caso, asesor, timestamp, tipo de acción | — |
| **RNF-12** | Respaldo | Backups automáticos diarios de la base de datos | — |
