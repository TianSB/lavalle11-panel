// ============================================================
// messagesApi.test.ts — Tests para enviarMensajeCallbell
// ============================================================

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Mock global fetch antes de importar el módulo
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Importamos después de mockear fetch
const { enviarMensajeCallbell } = await import("../callbell/messagesApi.js");

// -----------------------------------------------------------
// Test helpers
// -----------------------------------------------------------

function mockCallbellSuccess(messageId = "msg-uuid-123") {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: { uuid: messageId } }),
  });
}

function mockCallbellError(status = 400, errorMsg = "Bad request") {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: errorMsg }),
  });
}

function mockCallbellNetworkError() {
  mockFetch.mockRejectedValue(new Error("Network error"));
}

// -----------------------------------------------------------
// Setup
// -----------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CALLBELL_API_TOKEN = "test-token-valid";
});

// -----------------------------------------------------------
// Tests
// -----------------------------------------------------------

describe("enviarMensajeCallbell", () => {
  // ---------------------------------------------------------
  // Validación de entrada
  // ---------------------------------------------------------

  it("debe rechazar número sin prefijo + y sin formato 549", async () => {
    const result = await enviarMensajeCallbell("12345", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("inválido");
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("debe aceptar número argentino sin prefijo + (formato Callbell)", async () => {
    mockCallbellSuccess("msg-549-ok");

    const result = await enviarMensajeCallbell("5492915018723", "Hola");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe("msg-549-ok");
    }
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("debe rechazar número vacío", async () => {
    const result = await enviarMensajeCallbell("", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("inválido");
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("debe rechazar cuando CALLBELL_API_TOKEN no está configurado", async () => {
    delete process.env.CALLBELL_API_TOKEN;

    const result = await enviarMensajeCallbell("+542914001234", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("no configurado");
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  // Camino feliz
  // ---------------------------------------------------------

  it("debe enviar mensaje exitosamente y devolver messageId", async () => {
    mockCallbellSuccess("msg-abc-456");

    const result = await enviarMensajeCallbell(
      "+542914001234",
      "Hola, confirmamos tu turno",
      "conv-uuid-789",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe("msg-abc-456");
    }

    // Verificar que fetch fue llamado correctamente
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as [string, Record<string, unknown>];

    // URL
    expect(callArgs[0]).toBe("https://api.callbell.eu/v1/messages/send");

    // Headers
    const options = callArgs[1] as { headers: Record<string, string>; body: string };
    expect(options.headers.Authorization).toBe("Bearer test-token-valid");
    expect(options.headers["Content-Type"]).toBe("application/json");

    // Body
    const body = JSON.parse(options.body) as { to: string; content: { text: string }; type: string; from: string };
    expect(body.to).toBe("+542914001234");
    expect(body.content.text).toBe("Hola, confirmamos tu turno");
    expect(body.type).toBe("text");
    expect(body.from).toBe("whatsapp");
  });

  it("debe devolver 'unknown' como messageId cuando la API no devuelve uuid", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: {} }),
    });

    const result = await enviarMensajeCallbell("+542914001234", "Hola");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe("unknown");
    }
  });

  // ---------------------------------------------------------
  // Manejo de errores
  // ---------------------------------------------------------

  it("debe fallar con mensaje de error HTTP", async () => {
    mockCallbellError(400, "Invalid phone number");

    const result = await enviarMensajeCallbell("+542914001234", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid phone number");
    }
  });

  it("debe reintentar 1 vez en error de red y luego fallar", async () => {
    mockCallbellNetworkError();

    const result = await enviarMensajeCallbell("+542914001234", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Network error");
    }
    // Fetch debería haberse llamado 2 veces (original + 1 retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("debe reintentar 1 vez en error HTTP 5xx y luego fallar", async () => {
    mockCallbellError(500, "Internal server error");

    const result = await enviarMensajeCallbell("+542914001234", "Hola");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Internal server error");
    }
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------
  // Timeout — verificar que se pasa AbortSignal
  // ---------------------------------------------------------

  it("debe pasar AbortSignal a fetch (timeout 10s)", async () => {
    // Mock que resuelve exitosamente para verificar el signal
    mockCallbellSuccess("timeout-test-ok");

    await enviarMensajeCallbell("+542914001234", "Hola");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    const options = callArgs[1] as { signal?: AbortSignal };
    expect(options.signal).toBeDefined();
    expect(options.signal instanceof AbortSignal).toBe(true);
  });
});

// -----------------------------------------------------------
// Limpiar global fetch después de los tests
// -----------------------------------------------------------

afterAll(() => {
  vi.unstubAllGlobals();
});
