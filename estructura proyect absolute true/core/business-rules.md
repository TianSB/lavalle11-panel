# Reglas de Negocio

> Reglas de negocio del sistema extraídas del PRD y validadas con el equipo operativo.

---

## BR-01: Tabla de Obras Sociales (Google Sheets)

El sistema consulta en tiempo real una Google Sheet mantenida por el equipo con:

| Columna | Descripción |
|---|---|
| Obra social | Nombre |
| Requiere copago | Sí/No |
| Monto estimado de copago | Número |
| Requiere llamada | Sí/No |
| Requiere autorización previa | Sí/No |
| Código FEMEBA disponible | Sí/No |
| Notas adicionales | Texto libre |

**Comportamiento:** Se cachea en Supabase con TTL de 5 minutos.

---

## BR-02: Estudios Sin Turno Previo (Tipo B)

Los siguientes estudios se resuelven automáticamente sin intervención del asesor:

- Radiografías (incluyendo espinografía y medición de MMII)
- Panorámicas dentales
- TAC Cone Beam dental

**Excepción:** si la radiografía panorámica requiere autorización previa por obra social, se eleva a asesor.

---

## BR-03: Derivación Automática a Medicina Nuclear

Si la práctica detectada es alguna de las siguientes:

- PET CT
- SPECT CT
- Centellograma
- Perfusión Miocárdica
- Gammagrafía
- Cámara Gamma

**Acción:** Se crea card con flag `CHICLANA`, se activa flujo de derivación, se notifica a la secretaría de Chiclana.

---

## BR-04: Prácticas No Realizadas

El instituto no realiza estas prácticas → respuesta automática informativa:

- Resonancia magnética
- Histerosalpingografía
- Electromiografía
- Polisomnografía
- Endoscopía (alta y baja)
- Colonoscopía
- Tomografía de senos paranasales (solo realizan CBCT dental)

---

## BR-05: Radiografías Sin Informe Escrito

Las radiografías solicitadas por médicos traumatólogos no generan informe escrito. Cuando un paciente consulta por el informe de una RX, el sistema detecta el médico derivante y aplica esta regla automáticamente.

---

## BR-06: Token IOMA

Los pacientes de IOMA deben concurrir con el número de TOKEN de la aplicación móvil de IOMA. Sin ese número no se puede realizar la práctica. Esta advertencia se incluye automáticamente en el mensaje de confirmación cuando la obra social es IOMA.

---

## BR-07: Reconocimiento de Contactos Recurrentes

El sistema busca el número de teléfono en el historial de casos. Si existe actividad previa, la card muestra un indicador de contacto recurrente con acceso al historial.

---

## BR-08: Tabla de Precios

Los precios de los estudios se mantienen en la misma Google Sheet de obras sociales, con:

- Precio por transferencia
- Precio en efectivo

El sistema consulta automáticamente cuando detecta una consulta de precio.
Incluye advertencia de vigencia mensual.

---

## BR-09: Seguimiento Obligatorio para Tipo H

Los casos de punción o biopsia (Tipo H) requieren seguimiento activo:
- Fecha de seguimiento obligatoria
- Son los casos más propensos a caerse sin resolución

---

## BR-10: Prioridad de Casos

| Prioridad | Color | Criterio |
|---|---|---|
| Urgente | 🔴 Rojo | Flag crítico activo |
| Normal | 🟠 Naranja | Pendiente de verificación |
| Bajo | 🟢 Verde | Listo para asignar |

---

## BR-11: Cierre de Conversación en Callbell

Al cerrar un caso, el sistema cierra automáticamente la conversación en Callbell mediante su API.

---

## BR-12: Closing Reasons

| Closing Reason | Descripción |
|---|---|
| Turno asignado | Confirmación enviada al paciente |
| Turno reprogramado | Fecha/hora modificada |
| Turno cancelado | Cancelación confirmada |
| Consulta resuelta | Consulta general respondida |
| Consulta resuelta Portal Web | Paciente accedió al portal |
| Esperando respuesta | Aguarda decisión del paciente |
| Derivado a Chiclana | Medicina Nuclear derivada |
| Práctica no disponible | Estudio no se realiza |
| Equivocado | Contacto equivocado |
| Error de datos en RIS | DNI mal cargado corregido |
| Presupuesto pendiente | Presupuesto en proceso |
| Sin resolución | No pudo resolverse |
