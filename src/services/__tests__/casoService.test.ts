// ============================================================
// casoService.test.ts — Tests para buildFlags, reabrirCaso, actualizarExtraccionIA
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { buildFlags, reabrirCaso, actualizarExtraccionIA } from "../supabase/casoService.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  respuestaNormal,
  respuestaConfianzaBaja,
  respuestaChiclana,
  payloadNormal,
  payloadConMisRx,
} from "./fixtures.js";

// -----------------------------------------------------------
// buildFlags
// -----------------------------------------------------------

describe("buildFlags", () => {
  it("debe incluir error_ia cuando no hay analisis", () => {
    // Sin analisis, sin misrx — solo error_ia
    const result = buildFlags(undefined, payloadNormal);
    // buildFlags devuelve un array con error_ia but... wait, with no analisis and no misrx:
    // - analisis is undefined → flags.add("error_ia")
    // - That's it
    // result should be ["error_ia"]
    // BUT: the code first checks this:
    // if (!analisis) { flags.add("error_ia"); }
    // So the set has "error_ia"
    // Then: return flags.size > 0 ? Array.from(flags) : null
    // Result: null? No, "error_ia" was added, so size > 0
    // Actually wait: when analisis is undefined:
    // const flags = new Set<string>(analisis?.flags ?? []);
    // = new Set<string>(undefined ?? []) = new Set<string>([]) = empty set
    // if (analisis && analisis.confianza_global < 0.7) → false (analisis is undefined)
    // if (analisis?.obra_social?.toLowerCase().includes("ioma")) → false
    // if (analisis?.tipo_practica && ...) → false
    // if (parsed.message?.has_misrx_link) → false (payloadNormal has has_misrx_link: false)
    // if (analisis && analisis.campos_baja_confianza.length > 0) → false
    // if (!analisis) → true → flags.add("error_ia")
    // return flags.size > 0 ? Array.from(flags) : null → ["error_ia"]
    expect(result).toEqual(["error_ia"]);
  });

  it("debe incluir flags de IA cuando vienen en el analisis", () => {
    const result = buildFlags(respuestaNormal, payloadNormal);
    expect(result).toContain("ayuno");
  });

  it("debe agregar token_ioma cuando obra_social contiene IOMA", () => {
    const result = buildFlags(respuestaNormal, payloadNormal);
    expect(result).toContain("token_ioma");
  });

  it("debe agregar baja_confianza cuando confianza_global < 0.7", () => {
    const result = buildFlags(respuestaConfianzaBaja, payloadNormal);
    expect(result).toContain("baja_confianza");
  });

  it("debe agregar baja_confianza cuando hay campos_baja_confianza", () => {
    const result = buildFlags(respuestaConfianzaBaja, payloadNormal);
    expect(result).toContain("baja_confianza");
  });

  it("debe agregar orden_digital_misrx cuando has_misrx_link es true", () => {
    const result = buildFlags(respuestaNormal, payloadConMisRx);
    expect(result).toContain("orden_digital_misrx");
  });

  it("debe agregar chiclana cuando tipo_practica es pet_ct", () => {
    const result = buildFlags(respuestaChiclana, payloadNormal);
    expect(result).toContain("chiclana");
  });

  it("debe incluir flags IA + flags sistema simultáneamente", () => {
    const result = buildFlags(respuestaNormal, payloadNormal);
    expect(result).toContain("ayuno");       // flag IA
    expect(result).toContain("token_ioma"); // flag sistema
  });

  it("debe devolver null cuando no hay flags (flags IA vacío, sin condiciones de sistema)", () => {
    // analisis con flags vacío, confianza alta, sin ioma, sin misrx
    const analisisLimpio = { ...respuestaNormal, flags: [], obra_social: "OSDE", confianza_global: 0.95, campos_baja_confianza: [] };
    const result = buildFlags(analisisLimpio, payloadNormal);
    expect(result).toBeNull();
  });

  it("debe incluir error_ia cuando analisis es undefined aunque haya misrx", () => {
    const result = buildFlags(undefined, payloadConMisRx);
    expect(result).toContain("error_ia");
    expect(result).toContain("orden_digital_misrx");
  });
});

// -----------------------------------------------------------
// reabrirCaso
// -----------------------------------------------------------

describe("reabrirCaso", () => {
  it("debe llamar a supabase.from('casos').update().eq() correctamente", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    const result = await reabrirCaso(supabase, "LV-0001");

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("casos");
    expect(mockUpdate).toHaveBeenCalledWith({
      estado: "pendiente",
      closing_reason: null,
      resolved_at: null,
    });
    expect(mockEq).toHaveBeenCalledWith("id", "LV-0001");
  });

  it("debe devolver false cuando Supabase devuelve error", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error("DB error") });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    const result = await reabrirCaso(supabase, "LV-0001");

    expect(result).toBe(false);
  });
});

// -----------------------------------------------------------
// actualizarExtraccionIA
// -----------------------------------------------------------

describe("actualizarExtraccionIA", () => {
  it("debe llamar a supabase.from('extracciones_ia').update().eq() con datos del analisis", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    await actualizarExtraccionIA(supabase, "LV-0001", respuestaNormal, payloadNormal);

    expect(mockFrom).toHaveBeenCalledWith("extracciones_ia");
    expect(mockEq).toHaveBeenCalledWith("caso_id", "LV-0001");

    // Verificar que se pasaron los datos del analisis
    const updateArg = mockUpdate.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateArg.paciente_nombre).toBe("Juan Pérez");
    expect(updateArg.practica).toBe("Ecografía abdominal completa");
    expect(updateArg.obra_social).toBe("IOMA");
    expect(updateArg.confianza_global).toBe(0.92);
    expect(updateArg.modelo_ia).toBe("mock");
  });

  it("debe incluir flags generados por buildFlags", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    await actualizarExtraccionIA(supabase, "LV-0001", respuestaNormal, payloadNormal);

    const updateArg = mockUpdate.mock.calls[0]![0] as Record<string, unknown>;
    const flags = updateArg.flags as string[];
    expect(flags).toContain("ayuno");
    expect(flags).toContain("token_ioma");
  });

  it("debe incluir todos los campos opcionales del analisis", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    await actualizarExtraccionIA(supabase, "LV-0001", respuestaNormal, payloadNormal);

    const updateArg = mockUpdate.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateArg.paciente_dni).toBe("12345678");
    expect(updateArg.nro_afiliado).toBe("987654");
    expect(updateArg.medico_derivante).toBe("Dr. García");
    expect(updateArg.matricula).toBe("MP 12345");
    expect(updateArg.diagnostico).toBe("Control rutinario");
    expect(updateArg.motivo_solicitud).toBe("control");
    expect(updateArg.tiempo_procesamiento_ms).toBe(50);
    expect(updateArg.prompt_usado).toBe("MOCK");
  });

  it("debe manejar error de Supabase sin lanzar excepción (no bloqueante)", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error("DB error") });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    // No debe lanzar excepción
    await expect(
      actualizarExtraccionIA(supabase, "LV-0001", respuestaNormal, payloadNormal),
    ).resolves.toBeUndefined();
  });
});
