# Plan Detallado — Fase 1: Panel Estático

> **Objetivo:** Validar el diseño del panel web con Franco antes de conectar el backend.
> **Duración estimada:** 1–2 semanas
> **Stack:** React + Vite + Tailwind CSS + Supabase Auth (solo login)

---

## Tareas

### 1.1 Inicializar proyecto

- [ ] Crear repositorio en GitHub (`lavalle11-panel`)
- [ ] Inicializar proyecto con `npm create vite@latest` (React + TypeScript)
- [ ] Configurar Tailwind CSS v4
- [ ] Configurar deploy automático en Vercel desde `main`
- [ ] Configurar ESLint y Prettier

**Archivos involucrados:**
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `tsconfig.json`

### 1.2 Layout del panel

- [ ] Sidebar/header con navegación y nombre del asesor logueado
- [ ] Grid de cards con columnas responsivas (3 cols desktop, 2 tablet, 1 mobile)
- [ ] Barra superior con contadores (total casos, pendientes, míos)

**Componentes:**
- `AppLayout.tsx` — Layout principal con sidebar y header
- `CaseCard.tsx` — Card individual
- `CaseGrid.tsx` — Grid de cards
- `StatusBar.tsx` — Barra de contadores

### 1.3 Vistas de filtro

- [ ] Cola general — todos los casos activos
- [ ] Mi bandeja — casos del asesor logueado
- [ ] Por tipo — filtro por los 11 tipos (A–K)
- [ ] Por estado — pendiente, en proceso, esperando respuesta
- [ ] Seguimientos pendientes — casos con fecha de seguimiento para hoy

**Componentes:**
- `FilterBar.tsx` — Barra de filtros con tabs y dropdowns
- Vista por tipo y por estado como variantes del mismo componente

### 1.4 Modal de resolución

- [ ] Resumen IA expandido con campos extraídos
- [ ] Visor de orden médica (imagen/PDF en modal o panel lateral)
- [ ] Campos de baja confianza resaltados en amarillo
- [ ] Selector de sede (Lavalle 11 / Chiclana)
- [ ] Estado de cobertura (verificada / particular / pendiente)
- [ ] Selector de fecha y hora
- [ ] Checkboxes de instrucciones de preparación:
  - Ayuno
  - AINES
  - Traer orden
  - Traer estudios previos
  - Token IOMA (condicional)
  - Otro (texto libre)
- [ ] Vista previa del mensaje WhatsApp generado en tiempo real
- [ ] Botón de llamada WhatsApp Desktop (wa.me/)
- [ ] Campo de nota interna con fecha de seguimiento
- [ ] Botón de envío

**Componentes:**
- `CaseModal.tsx` — Modal principal
- `ExtractionSummary.tsx` — Resumen IA expandido
- `ImageViewer.tsx` — Visor de orden médica
- `CoverageStatus.tsx` — Estado de cobertura
- `DateTimePicker.tsx` — Selector de fecha/hora
- `InstructionsChecklist.tsx` — Checkboxes de instrucciones
- `MessagePreview.tsx` — Vista previa del mensaje
- `CallButton.tsx` — Botón de llamada WhatsApp
- `InternalNote.tsx` — Nota interna con fecha de seguimiento

### 1.5 Datos mock

- [ ] Crear 8–12 casos de ejemplo cubriendo tipos A–K
- [ ] Incluir casos con flags, baja confianza, contactos recurrentes

**Archivos:**
- `src/data/mockCases.ts` — Array de casos mock

### 1.6 Autenticación

- [ ] Configurar proyecto Supabase
- [ ] Implementar login con email + contraseña
- [ ] Implementar roles: asesor / administrador
- [ ] Proteger rutas según rol

**Componentes:**
- `LoginPage.tsx` — Página de login
- `AuthGuard.tsx` — Componente de protección de rutas

### 1.7 Validación

- [ ] Demo con Franco Berardi
- [ ] Ajustes basados en feedback
- [ ] Aprobación para pasar a Fase 2

---

## Mock Data para Fase 1

```typescript
interface MockCase {
  id: string;             // LV-0001
  tipo: 'A' | 'B' | ... | 'K';
  prioridad: 'urgente' | 'normal' | 'bajo';
  estado: 'pendiente' | 'en_proceso' | 'esperando_respuesta';
  paciente: string;
  practica: string;
  obraSocial: string;
  flags: string[];
  tiempoEspera: string;   // "hace 15 min"
  resumen: string;        // texto de una línea
  sede: 'lavalle11' | 'chiclana';
  cobertura: string;
  fechaSugerida?: string;
}
```

Crear al menos un caso de cada tipo A–K con datos realistas.

---

## Criterios de Aceptación

1. ✅ Las cards se muestran correctamente en grilla responsiva
2. ✅ Los 5 filtros funcionan correctamente
3. ✅ El modal de resolución tiene todos los campos del PRD
4. ✅ La vista previa del mensaje se genera en tiempo real
5. ✅ El botón de WhatsApp abre wa.me/ con el número correcto
6. ✅ Login funcional con roles asesor/administrador
7. ✅ Diseño aprobado por Franco
