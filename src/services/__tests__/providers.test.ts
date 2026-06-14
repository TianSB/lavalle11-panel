// ============================================================
// providers.test.ts — Tests para MockAIProvider y aiFactory
// ============================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockAIProvider } from "../ai/mockProvider.js";
import { getAIProvider, _resetAIProvider } from "../ai/aiFactory.js";
import { entradaSinAdjuntos, entradaConAdjuntos } from "./fixtures.js";

// -----------------------------------------------------------
// MockAIProvider
// -----------------------------------------------------------

describe("MockAIProvider", () => {
  const provider = new MockAIProvider();

  it("debe tener nombre 'mock'", () => {
    expect(provider.nombre).toBe("mock");
  });

  it("debe implementar AIProvider (tiene método analizarCaso)", () => {
    expect(typeof provider.analizarCaso).toBe("function");
  });

  it("debe devolver RespuestaCanónica con tipo_caso A y prioridad normal", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.tipo_caso).toBe("A");
    expect(result.prioridad).toBe("normal");
  });

  it("debe usar el nombre del contacto de la entrada", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.paciente_nombre).toBe("Juan Pérez");
  });

  it("debe devolver obra_social IOMA", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.obra_social).toBe("IOMA");
  });

  it("debe devolver confianza_global 0.92", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.confianza_global).toBe(0.92);
  });

  it("debe devolver modelo_ia 'mock'", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.modelo_ia).toBe("mock");
  });

  it("debe devolver campos_baja_confianza vacío", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.campos_baja_confianza).toEqual([]);
  });

  it("debe devolver orden_tipo 'no_aplica' cuando no hay adjuntos", async () => {
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.orden_tipo).toBe("no_aplica");
    expect(result.orden_url).toBeNull();
  });

  it("debe devolver orden_tipo 'imagen' cuando hay adjuntos", async () => {
    const result = await provider.analizarCaso(entradaConAdjuntos);
    expect(result.orden_tipo).toBe("imagen");
    expect(result.orden_url).toBe(entradaConAdjuntos.adjuntos[0]!.url);
  });

  it("debe tardar ~50ms (simulación de latencia)", async () => {
    const inicio = Date.now();
    await provider.analizarCaso(entradaSinAdjuntos);
    const duracion = Date.now() - inicio;
    expect(duracion).toBeGreaterThanOrEqual(40);
    expect(duracion).toBeLessThan(200); // margen amplio para CI
  });
});

// -----------------------------------------------------------
// aiFactory
// -----------------------------------------------------------

describe("aiFactory", () => {
  beforeEach(() => {
    _resetAIProvider();
    delete process.env.PRIMARY_PROVIDER;
  });

  it("debe devolver MockAIProvider por defecto (sin PRIMARY_PROVIDER)", () => {
    const provider = getAIProvider();
    expect(provider.nombre).toBe("mock");
  });

  it("debe devolver MockAIProvider cuando PRIMARY_PROVIDER=mock", () => {
    process.env.PRIMARY_PROVIDER = "mock";
    const provider = getAIProvider();
    expect(provider.nombre).toBe("mock");
  });

  it("debe ser singleton: dos llamadas devuelven la misma instancia", () => {
    process.env.PRIMARY_PROVIDER = "mock";
    const a = getAIProvider();
    const b = getAIProvider();
    expect(a).toBe(b);
  });

  it("debe resetear el singleton con _resetAIProvider", () => {
    process.env.PRIMARY_PROVIDER = "mock";
    const a = getAIProvider();
    _resetAIProvider();
    const b = getAIProvider();
    expect(a).not.toBe(b);
  });

  it("debe devolver MockAIProvider como fallback cuando el provider es desconocido", () => {
    process.env.PRIMARY_PROVIDER = "inexistente";
    const provider = getAIProvider();
    expect(provider.nombre).toBe("mock");
  });

  it("debe devolver MockAIProvider como fallback cuando ANTHROPIC_API_KEY falta en modo claude", () => {
    process.env.PRIMARY_PROVIDER = "claude";
    delete process.env.ANTHROPIC_API_KEY;
    // ClaudeAdapter lanza error en constructor → factory cae en mock
    const provider = getAIProvider();
    expect(provider.nombre).toBe("mock");
  });

  it("MockAIProvider.analizarCaso debe funcionar correctamente", async () => {
    process.env.PRIMARY_PROVIDER = "mock";
    const provider = getAIProvider();
    const result = await provider.analizarCaso(entradaSinAdjuntos);
    expect(result.paciente_nombre).toBe("Juan Pérez");
    expect(result.practica).toBe("Ecografía abdominal completa");
  });
});
