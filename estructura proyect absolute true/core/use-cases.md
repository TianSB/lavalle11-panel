# Casos de Uso

> Lista completa de casos de uso del sistema, organizados por actor.

---

## Actor: Paciente (via WhatsApp)

| ID | Nombre | Descripción | Flujo |
|---|---|---|---|
| CU-01 | Solicitar turno con orden | Envía mensaje + foto/PDF de orden médica | Mensaje → Callbell → webhook → IA → card |
| CU-02 | Consultar precio | Pregunta costo de uno o varios estudios | Mensaje → IA detecta → panel genera respuesta con precios |
| CU-03 | Reprogramar turno | Pide cambiar fecha/hora de turno existente | Mensaje → IA detecta → card tipo I |
| CU-04 | Cancelar turno | Solicita cancelación | Mensaje → IA detecta → card tipo J |
| CU-05 | Consultar resultado | Pide acceso a informe o portal | Mensaje → IA detecta → card tipo F |
| CU-06 | Consultar disponibilidad | Pregunta horarios sin orden médica | Mensaje → IA detecta → card tipo B |

## Actor: Asesor (via Panel Web)

| ID | Nombre | Descripción |
|---|---|---|
| CU-07 | Ver cola de casos | Visualiza cards en tiempo real con filtros |
| CU-08 | Asignarse un caso | Toma un caso de la cola general |
| CU-09 | Revisar análisis IA | Valida campos extraídos y resalta baja confianza |
| CU-10 | Confirmar turno | Selecciona sede, fecha, hora, instrucciones y envía |
| CU-11 | Realizar llamada | Abre WhatsApp Desktop con número precargado |
| CU-12 | Registrar llamada | Ingresa duración estimada post-llamada |
| CU-13 | Derivar a Chiclana | Confirma derivación y sistema notifica |
| CU-14 | Agregar nota de seguimiento | Escribe nota interna + fecha de follow-up |
| CU-15 | Cerrar caso sin resolver | Registra closing reason y nota obligatoria |
| CU-16 | Ver historial del paciente | Accede a casos anteriores del mismo número |

## Actor: Administrador (via Panel Web)

| ID | Nombre | Descripción |
|---|---|---|
| CU-17 | Ver tablero de métricas | KPIs operativos en tiempo real |
| CU-18 | Gestionar usuarios | Alta/baja de asesores |
| CU-19 | Configurar obras sociales | Edita Google Sheet (externo al sistema) |

## Actor: Sistema (Automático)

| ID | Nombre | Descripción |
|---|---|---|
| CU-20 | Recibir webhook Callbell | Procesa mensaje entrante |
| CU-21 | Analizar con Claude API | Extrae datos estructurados + clasifica tipo |
| CU-22 | Resolver Tipo B automático | Radiografías, panorámicas, CBCT sin asesor |
| CU-23 | Responder práctica no disponible | Envía mensaje informativo automático |
| CU-24 | Detectar contacto recurrente | Busca historial por teléfono |
| CU-25 | Cachear Google Sheets | Sincroniza tabla de coberturas y precios |
| CU-26 | Cerrar conversación en Callbell | Callbell API post-resolución |

## Matriz de Cobertura por Tipo de Caso

| Tipo | Nombre | CU Principal | Automático |
|---|---|---|---|
| A | Turno estándar con orden | CU-01, CU-10 | No |
| B | Estudio sin turno (orden de llegada) | CU-06 | ✅ Sí |
| C | Consulta de precios | CU-02 | Semiautomático |
| D | Caso con copago | CU-11, CU-12 | No (requiere llamada) |
| E | Derivación a Medicina Nuclear | CU-13 | Semiautomático |
| F | Consulta de resultados | CU-05 | Semiautomático |
| G | Médico/consultorio derivante | CU-09 | No |
| H | Punción/biopsia — presupuesto | CU-14, CU-15 | No |
| I | Reprogramación | CU-03 | Semiautomático |
| J | Cancelación | CU-04 | Casi automático |
| K | Contacto equivocado / práctica no disponible | CU-23 | ✅ Sí |
