// ============================================================
// aiFactory.ts — Selecciona el AIProvider según configuración
// ============================================================
// Uso: getAIProvider() → devuelve el provider configurado.
// Singleton: la primera llamada crea la instancia; las siguientes
// reusan la misma.
//
// Fallback: si el provider configurado falla al inicializar,
// se usa MockAIProvider (nunca bloquear la creación de un caso).
// ============================================================

import type { AIProvider } from "./types.js";
import { ClaudeAdapter } from "./claudeAdapter.js";
import { MockAIProvider } from "./mockProvider.js";

type ProviderName = "claude" | "mock";

const REGISTRY: Record<ProviderName, () => AIProvider> = {
  claude: () => new ClaudeAdapter(),
  mock: () => new MockAIProvider(),
};

let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_instance) return _instance;

  const nombre = (process.env.PRIMARY_PROVIDER ?? "mock") as ProviderName;
  const factory = REGISTRY[nombre];

  if (!factory) {
    console.warn(`[AI_FACTORY] Provider desconocido: "${nombre}", usando mock`);
    _instance = new MockAIProvider();
    return _instance;
  }

  try {
    _instance = factory();
    console.log(`[AI_FACTORY] Provider activo: ${_instance.nombre}`);
  } catch (err) {
    console.error("[AI_FACTORY] Error al inicializar provider, usando mock:", err);
    _instance = new MockAIProvider();
  }

  return _instance;
}

/** Para tests — resetear el singleton entre pruebas */
export function _resetAIProvider(): void {
  _instance = null;
}
