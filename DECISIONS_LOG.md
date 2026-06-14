# DECISIONS LOG — Panel de Gestión de Turnos con IA

> Decisiones técnicas relevantes del sistema.
> No incluye decisiones triviales ni discusiones de diseño no adoptadas.
> Cada decisión incluye: qué se decidió, por qué, qué problema resuelve.

---

## D01 — RPC para Asignación Atómica vs UPDATE Directo

**Decisión:** Crear una función RPC PostgreSQL (`assign_case`) con UPDATE condicional en una sola sentencia SQL, SECURITY INVOKER.

**Alternativa descartada:** `UPDATE casos SET asesor_id = ? WHERE id = ? AND asesor_id IS NULL` desde el cliente frontend.

**Problema que resuelve:**
- **Concurrencia**: PostgreSQL MVCC garantiza que solo 1 transacción vea `asesor_id IS NULL` al mismo tiempo. Dos asesores que cliquean simultáneamente sobre el mismo caso: solo 1 gana, el otro recibe `CASE_ALREADY_TAKEN`.
- **Atomicidad**: Una sola sentencia SQL no tiene race conditions entre SELECT y UPDATE.
- **Seguridad**: SECURITY INVOKER respeta RLS del usuario autenticado. El frontend nunca ejecuta SQL directo.
- **Determinismo**: La RPC retorna `{ ok, code, case_id }` — el frontend sabe exactamente qué pasó sin hacer consultas adicionales.

**Trade-off:** El UPDATE no es una transacción explícita (BEGIN/COMMIT) pero PostgreSQL trata cada sentencia SQL como atómica. Es suficiente para este caso de uso.

---

## D02 — RLS como Capa de Seguridad Obligatoria vs Seguridad en el Cliente

**Decisión:** RLS habilitado en las 10 tablas del esquema, con políticas que filtran por `auth_rol()` y `asesor_id`. El frontend usa el cliente anon de Supabase (nunca service-role).

**Alternativa descartada:** Filtrar datos en el frontend (ej: `casos.filter(c => c.asesor_id === userId)`).

**Problema que resuelve:**
- **Fuga cross-user**: Si un frontend malicioso modifica la query, RLS lo bloquea. El cliente anon solo ve filas que las políticas permiten.
- **Single source of truth**: La seguridad está en la BD, no en el código JavaScript. Un bug en el frontend no expone datos.
- **Herencia de visibilidad**: Tablas hijas (mensajes, adjuntos, turnos) heredan la visibilidad del caso padre vía subquery EXISTS.

**Trade-off:** Las políticas `casos_update_policy` duplican condiciones que también están en la RPC. Defensa en profundidad aceptable.

---

## D03 — Supabase Realtime para Sincronización de Eventos vs Polling

**Decisión:** Usar Supabase Realtime (WebSocket) con publicación `supabase_realtime` en tabla `casos`, más hook `useCaseRealtimeSync` con dedup y debounce.

**Alternativa descartada:** Polling HTTP cada N segundos (`setInterval(refetch, 5000)`).

**Problema que resuelve:**
- **Latencia**: Los cambios se propagan en <100ms vs 5s de polling. UX significativamente mejor cuando otro asesor toma un caso.
- **Carga en la BD**: Sin polling, la BD recibe consultas solo cuando hay cambios reales.
- **Escalabilidad**: El WebSocket de Supabase escala horizontalmente sin carga adicional en la aplicación.

**Trade-off:** Dependencia de conexión WebSocket persistente. En desconexiones, el hook tiene reconnect handler con refetch automático.

---

## D04 — Optimistic UI + Reconciliation Reducer vs Esperar a la RPC

**Decisión:** El frontend muestra feedback visual inmediato (overlay "claiming") antes de que la RPC responda. Luego reconcilia con el resultado real (claimed_by_me / claimed_by_other / failed).

**Alternativa descartada:** Bloquear la UI hasta que la RPC responda (spinner + botón deshabilitado).

**Problema que resuelve:**
- **Percepción de velocidad**: El usuario ve feedback en <5ms vs 100-300ms de latencia de red. El overlay "claiming" aparece instantáneamente.
- **Consistencia multi-vista**: El estado se almacena en un store global (CaseUIStore), no en el componente. Si el mismo caso aparece en cola general y en bandeja, ambas vistas muestran el mismo overlay.
- **Recuperación**: Si la RPC falla, el overlay cambia a "failed" con descripción del error. Auto-reset a idle después de 3s.

**Trade-off:** Complejidad adicional (reducer, 4 estados, optimistic lock, freshness window, reconciliation pipeline). La máquina de estados tiene 7 pasos en el pipeline.

---

## D05 — CasoService Desacoplado (Context DI) vs Singleton Global

**Decisión:** Inyección de dependencias vía React Context (`CasoServiceContext` + `useCasoService()`). Sin singleton global mutable.

**Alternativa descartada:** Módulo singleton `getActiveService()` / `setCasoService()`.

**Problema que resuelve:**
- **Testeabilidad**: Cada test puede montar su propio provider con un mock service. El singleton requería limpiar estado global entre tests.
- **Multi-tenant**: Futuro — cada clínica/tenant con su propio CasoService (diferente base de datos, diferente lógica de IA).
- **Hot-reload**: React maneja el ciclo de vida del contexto. El singleton mutable requería manejo manual de recarga.
- **Estado oculto**: El servicio es explícito en el árbol React. No hay estado mutable global fuera del alcance de React.

**Trade-off:** Los hooks deben estar dentro del árbol del provider. No se puede llamar `getCasos()` fuera de un componente React.

---

## D06 — useReducer Nativo para Estado UI vs Redux / Zustand

**Decisión:** `useReducer` de React + React Context para el store global de UI de casos. Cero dependencias externas.

**Alternativa descartada:** Redux, Zustand, Jotai, XState.

**Problema que resuelve:**
- **Simplicidad**: El estado UI es un mapa `Record<caseId, CaseUIEntry>` con 4 acciones (SET, CLEAR, RECONCILE, SET_MULTI). No justifica una librería externa.
- **Bundle size**: 0 KB adicionales. Redux Toolkit ~12KB gzip.
- **TypeScript**: Tipado completo sin boilerplate de selectors ni actions creators.

**Trade-off:** Las actions fuera del reducer (optimistic locks, cross-tab locks) viven como Maps module-level con timers. Esto es intencional — no deberían disparar re-renders, solo proteger el RECONCILE.

---

## D07 — BroadcastChannel para Cross-Tab Sync vs localStorage Events

**Decisión:** `BroadcastChannel` API nativa para comunicación entre tabs del mismo usuario. Con eventId via `crypto.randomUUID()` en `sessionStorage`.

**Alternativa descartada:** `window.addEventListener("storage", ...)` + `localStorage.setItem()`.

**Problema que resuelve:**
- **Inconsistencias multi-tab**: Un usuario con 2 tabs abiertos no sabe que el otro tab empezó a tomar un caso. Con BroadcastChannel, Tab B ve "claimed_by_other" <100ms después de que Tab A hace clic.
- **Latencia**: BroadcastChannel es ~1ms vs ~10ms de localStorage events.
- **Payload estructurado**: Tipos fuertes (`CrossTabEvent` discriminated union) vs string parsing en localStorage.
- **Sin almacenamiento persistente**: Los eventos son efímeros — no quedan en localStorage cuando el usuario cierra el tab.

**Trade-off:** Sin fallback para Safari < 15.4 o navegadores que no soportan BroadcastChannel. En ese caso, la sincronización depende exclusivamente de Realtime eventual consistency.

---

## D08 — Module-Level Store para RBAC vs React Context

**Decisión:** El `currentRole` del RBAC vive como variable module-level en `can.ts`. `setRbacRole()` se llama desde AuthContext para sincronizar.

**Alternativa descartada:** React Context + `useCan()` hook como única forma de consultar permisos.

**Problema que resuelve:**
- **Acceso fuera de React**: `can()` se puede llamar desde cualquier parte del código (utilities, helpers, componentes no React) sin necesidad de hooks.
- **Sin provider anidado**: No hay que envolver partes del árbol con un `RBACProvider`. El AuthContext ya es el provider de autenticación.
- **Rendimiento**: No hay renders adicionales cuando cambia el rol — solo cambia una variable. Los componentes que necesitan reaccionar al rol usan `useCan()` que sí es hook.

**Trade-off:** Si hay dos AuthProviders montados (imposible en esta app), el ROLE de uno puede pisar al otro. Es responsabilidad de la app tener un solo AuthProvider.

---

## D09 — public.usuarios.rol como Única Fuente de Verdad del Rol

**Decisión:** El rol del usuario se almacena EXCLUSIVAMENTE en `public.usuarios.rol`. `auth.users.raw_user_meta_data` no contiene rol.

**Alternativa descartada:** Almacenar rol en `auth.users.raw_user_meta_data` (lo que hace Supabase por defecto).

**Problema que resuelve:**
- **Consistencia**: El trigger `sync_usuario_from_auth()` ya no pisa `rol = EXCLUDED.rol` en cada login. El rol se setea una vez al INSERT y solo se modifica manualmente.
- **Auditabilidad**: Cambiar un rol requiere UPDATE directo en `public.usuarios`. Queda registro en el trigger de auditoría.
- **Sin dependencia de Auth**: El rol sobrevive aunque Auth esté temporalmente caído (el dato está en la base de datos del instituto, no en Auth de Supabase).

**Trade-off:** Requiere INSERT explícito en `public.usuarios` cuando se crea un usuario en Auth. El trigger `sync_usuario_from_auth()` solo sincroniza nombre y email, no rol.

---

## D10 — Métricas Derivadas del Lado Cliente vs Consultas Agregadas en SQL

**Decisión:** Las métricas (resumen, casos por tipo, volumen diario) se computan del lado cliente con `useMemo` sobre los datos de `useCasos()`. Cero queries adicionales a Supabase.

**Alternativa descartada:** 3 consultas COUNT/agregadas a Supabase para cada visita a la pestaña de métricas.

**Problema que resuelve:**
- **Cero network calls**: Los datos ya están en el frontend después del fetch inicial de casos. Las métricas son transformaciones de datos locales.
- **Actualización sincronizada**: Cuando se hace refresh, las métricas se actualizan automáticamente porque `useMetricas()` deriva de `useCasos()`.
- **Simplicidad**: La lógica de agregación (counts, promedios, slices) es más fácil de mantener en JavaScript que en SQL.

**Trade-off:** Para >1000 casos, el `useMemo` podría volverse costoso (~1ms por 1000 casos). Si el volumen crece, se debe migrar a consultas agregadas en SQL.
