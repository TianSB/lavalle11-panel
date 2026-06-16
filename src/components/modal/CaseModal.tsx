import { useState, useCallback, useRef, useEffect } from "react";
import type { Caso, Sede, Instruccion } from "../../types";
import { supabase } from "../../lib/supabase";
import { Modal } from "../ui/Modal";
import { FlagBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { showToast } from "../ui/Toast";
import { ResumenIA } from "./ResumenIA";
import { Field } from "./Field";
import { SelectorSede } from "./SelectorSede";
import { SelectorFecha } from "./SelectorFecha";
import { SelectorHora } from "./SelectorHora";
import { ListaInstrucciones } from "./ListaInstrucciones";
import { VistaPreviaMensaje } from "./VistaPreviaMensaje";
import { FormSeguimiento } from "./FormSeguimiento";
import { TIPOS_CASO } from "../../constants";
import { formatDateTime } from "../../utils/dates";

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------

interface CaseModalProps {
  caso: Caso | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCasoAsignar?: (casoId: string) => void;
  onRefresh?: () => void;
}

// -----------------------------------------------------------
// Closing reasons labels
// -----------------------------------------------------------

const CLOSING_REASON_LABELS: Record<string, string> = {
  turno_asignado: "Turno asignado",
  turno_reprogramado: "Turno reprogramado",
  turno_cancelado: "Turno cancelado",
  consulta_resuelta: "Consulta resuelta",
  consulta_resuelta_portal: "Resuelta por portal web",
  esperando_respuesta: "Esperando respuesta del paciente",
  derivado_chiclana: "Derivado a Chiclana",
  practica_no_disponible: "Práctica no disponible",
  equivocado: "Contacto equivocado",
  error_datos_ris: "Error de datos en RIS",
  presupuesto_pendiente: "Presupuesto pendiente",
  sin_resolucion: "Sin resolución",
};

const CLOSING_REASONS = Object.keys(CLOSING_REASON_LABELS);

// -----------------------------------------------------------
// API helpers (inline fetch, sin dependencias extra)
// -----------------------------------------------------------

async function apiPost(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------

export function CaseModal({
  caso,
  isOpen,
  onClose,
  userId,
  onCasoAsignar,
  onRefresh,
}: CaseModalProps) {
  // --- Form state ---
  const [selectedSede, setSelectedSede] = useState<Sede>("lavalle11");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedInstrucciones, setSelectedInstrucciones] = useState<Instruccion[]>([]);
  const [seguimientoNota, setSeguimientoNota] = useState("");
  const [seguimientoFecha, setSeguimientoFecha] = useState("");

  // --- Dialog states ---
  const [isClosing, setIsClosing] = useState(false);
  const [isDerivar, setIsDerivar] = useState(false);

  // --- Loading states ---
  const [confirmarLoading, setConfirmarLoading] = useState(false);
  const [cerrarLoading, setCerrarLoading] = useState(false);
  const [derivarLoading, setDerivarLoading] = useState(false);

  // --- Adjuntos state (para botón Ver orden médica) ---
  const [adjuntosUrls, setAdjuntosUrls] = useState<string[]>([]);

  // --- Close dialog state ---
  const [selectedClosingReason, setSelectedClosingReason] = useState<string>("");
  const [closeNota, setCloseNota] = useState("");

  // --- Derivar dialog state ---
  const [derivarNotas, setDerivarNotas] = useState("");

  // --- Reset state on new case ---
  const prevCasoIdRef = useRef(caso?.id);
  if (caso && caso.id !== prevCasoIdRef.current) {
    prevCasoIdRef.current = caso.id;
    setSelectedSede("lavalle11");
    setSelectedDate("");
    setSelectedTime("09:00");
    setSelectedInstrucciones([]);
    setSeguimientoNota("");
    setSeguimientoFecha("");
    setIsClosing(false);
    setIsDerivar(false);
    setConfirmarLoading(false);
    setCerrarLoading(false);
    setDerivarLoading(false);
    setAdjuntosUrls([]);
    setSelectedClosingReason("");
    setCloseNota("");
    setDerivarNotas("");
  }

  const toggleInstruccion = useCallback((inst: Instruccion) => {
    setSelectedInstrucciones((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  }, []);

  // ==========================================================
  // Handlers
  // ==========================================================

  // --- Confirmar turno ---
  const handleConfirmar = useCallback(async () => {
    if (!caso || !selectedDate || !selectedTime) return;
    setConfirmarLoading(true);
    try {
      const res = await apiPost(`/api/casos/${caso.id}/confirmar`, {
        fecha: selectedDate,
        hora: selectedTime,
        sede: selectedSede,
        instrucciones: selectedInstrucciones,
        asesorId: userId,
      });
      if (res.ok) {
        showToast("Turno confirmado — mensaje enviado al paciente", "success");
        onRefresh?.();
        onClose();
      } else {
        showToast(`Error al confirmar: ${res.error}`, "error");
      }
    } catch {
      showToast("Error de conexión al confirmar turno", "error");
    } finally {
      setConfirmarLoading(false);
    }
  }, [caso, selectedDate, selectedTime, selectedSede, selectedInstrucciones, userId, onRefresh, onClose]);

  // --- Cerrar caso ---
  const handleCerrarCaso = useCallback(async () => {
    if (!caso || !selectedClosingReason) return;
    setCerrarLoading(true);
    try {
      const res = await apiPost(`/api/casos/${caso.id}/cerrar`, {
        closing_reason: selectedClosingReason,
        nota_interna: closeNota || undefined,
        asesorId: userId,
      });
      if (res.ok) {
        showToast("Caso cerrado correctamente", "success");
        setIsClosing(false);
        onRefresh?.();
        onClose();
      } else {
        showToast(`Error al cerrar: ${res.error}`, "error");
      }
    } catch {
      showToast("Error de conexión al cerrar caso", "error");
    } finally {
      setCerrarLoading(false);
    }
  }, [caso, selectedClosingReason, closeNota, userId, onRefresh, onClose]);

  // --- Derivar a Chiclana ---
  const handleDerivar = useCallback(async () => {
    if (!caso) return;
    setDerivarLoading(true);
    try {
      const res = await apiPost(`/api/casos/${caso.id}/derivar`, {
        notas: derivarNotas || undefined,
        asesorId: userId,
      });
      if (res.ok) {
        showToast("Caso derivado a Chiclana — notificación enviada", "success");
        setIsDerivar(false);
        onRefresh?.();
        onClose();
      } else {
        showToast(`Error al derivar: ${res.error}`, "error");
      }
    } catch {
      showToast("Error de conexión al derivar caso", "error");
    } finally {
      setDerivarLoading(false);
    }
  }, [caso, derivarNotas, userId, onRefresh, onClose]);

  // --- Tomar caso ---
  const handleTomarCaso = useCallback(() => {
    if (!caso || !onCasoAsignar) return;
    onCasoAsignar(caso.id);
  }, [caso, onCasoAsignar]);

  // --- Fetch adjuntos del caso cuando se abre el modal ---
  // Busca en tabla adjuntos (Storage) y también en extraccion_ia.orden_url
  useEffect(() => {
    if (!caso || !isOpen) {
      setAdjuntosUrls([]);
      return;
    }

    const urls: string[] = [];

    // 1. Agregar orden_url de extraccion_ia si existe
    if (caso.extraccion_ia.orden_url) {
      urls.push(caso.extraccion_ia.orden_url);
    }

    // 2. Buscar adjuntos en la tabla adjuntos (Storage)
    supabase
      .from("adjuntos")
      .select("file_url")
      .eq("caso_id", caso.id)
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          console.warn("[CASEMODAL] Error al obtener adjuntos:", error.message);
          // Aún así mostrar los que tenemos de orden_url
          if (urls.length > 0) setAdjuntosUrls(urls);
          return;
        }
        for (const row of data ?? []) {
          const fu = row.file_url as string;
          if (fu && !urls.includes(fu)) {
            urls.push(fu);
          }
        }
        setAdjuntosUrls(urls);
      });
  }, [caso?.id, isOpen]);

  if (!caso) return null;

  const isPendiente = caso.asesor_id === null;
  const tipoCasoLabel = TIPOS_CASO[caso.tipo_caso] ?? null;
  const esCerrado = caso.estado === "cerrado";
  const esNuclear = ["pet_ct", "spect_ct", "centellograma", "perfusion_miocardica", "camara_gamma"].includes(
    caso.extraccion_ia.tipo_practica,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${caso.id} — ${caso.contact_name}`}
      subtitle={formatDateTime(caso.created_at)}
      size="xl"
    >
      <div className="space-y-6">
        {/* Assign / Take case banner */}
        {isPendiente && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm text-blue-800 font-medium">Este caso no está asignado</p>
            <Button size="sm" onClick={handleTomarCaso}>
              Tomar caso
            </Button>
          </div>
        )}

        {/* AI Summary */}
        <ResumenIA extraccion={caso.extraccion_ia} />

        {/* Main info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Paciente" value={caso.extraccion_ia.paciente_nombre} />
          <Field label="DNI" value={caso.extraccion_ia.paciente_dni} />
          <Field label="Obra social" value={caso.extraccion_ia.obra_social} />
          <Field label="N° Afiliado" value={caso.extraccion_ia.nro_afiliado} />
          <Field label="Práctica" value={caso.extraccion_ia.practica} highlight />
          <Field label="Tipo" value={tipoCasoLabel} />
          <Field label="Médico derivante" value={caso.extraccion_ia.medico_derivante} />
          <Field label="Matrícula" value={caso.extraccion_ia.matricula} />
          <Field label="Diagnóstico" value={caso.extraccion_ia.diagnostico} />
          <Field label="Contacto" value={caso.contact_phone} />
        </div>

        {/* Flags */}
        {caso.extraccion_ia.flags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Alertas</p>
            <div className="flex flex-wrap gap-1.5">
              {caso.extraccion_ia.flags.map((flag) => (
                <FlagBadge key={flag} flag={flag} />
              ))}
            </div>
          </div>
        )}

        {/* Ver orden médica */}
        {adjuntosUrls.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Orden médica</p>
            <div className="flex flex-wrap gap-2">
              {adjuntosUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ver orden {adjuntosUrls.length > 1 ? `${i + 1}` : ""}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Si el caso no está cerrado, mostrar acciones */}
        {!esCerrado && (
          <>
            {/* Sede selector */}
            <SelectorSede selected={selectedSede} onChange={setSelectedSede} />

            {/* Date picker */}
            <SelectorFecha selectedDate={selectedDate} onChange={setSelectedDate} />

            {/* Time picker */}
            <SelectorHora selectedTime={selectedTime} onChange={setSelectedTime} />

            {/* Instrucciones */}
            <ListaInstrucciones selected={selectedInstrucciones} onToggle={toggleInstruccion} />

            {/* Message preview */}
            <VistaPreviaMensaje
              caso={caso}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedSede={selectedSede}
              selectedInstrucciones={selectedInstrucciones}
            />

            {/* Seguimiento */}
            <FormSeguimiento
              fecha={seguimientoFecha}
              nota={seguimientoNota}
              onFechaChange={setSeguimientoFecha}
              onNotaChange={setSeguimientoNota}
            />
          </>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {!esCerrado && (
              <>
                {/* Confirmar turno */}
                <Button
                  variant="success"
                  onClick={handleConfirmar}
                  disabled={!selectedDate || !selectedTime || confirmarLoading}
                >
                  {confirmarLoading ? "Confirmando..." : "Confirmar turno"}
                </Button>

                {/* Cerrar caso */}
                <Button variant="ghost" onClick={() => setIsClosing(true)} disabled={cerrarLoading}>
                  Cerrar caso
                </Button>

                {/* Derivar a Chiclana (solo si práctica nuclear) */}
                {esNuclear && (
                  <Button variant="secondary" size="sm" onClick={() => setIsDerivar(true)} disabled={derivarLoading}>
                    Derivar a Chiclana
                  </Button>
                )}


              </>
            )}

            {/* Llamar (siempre visible) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.open(`https://wa.me/${caso.contact_phone}`, "_blank");
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Llamar
            </Button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Modal: Cerrar caso */}
      {/* ================================================================ */}
      {isClosing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsClosing(false)} />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Cerrar caso</h3>

            {/* Closing reason selector */}
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Motivo de cierre</p>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-52 overflow-y-auto">
              {CLOSING_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedClosingReason(reason)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer ${
                    selectedClosingReason === reason
                      ? "border-blue-500 bg-blue-50 text-blue-800 font-medium"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {CLOSING_REASON_LABELS[reason]}
                </button>
              ))}
            </div>

            {/* Nota interna */}
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Nota interna (opcional)</p>
            <textarea
              value={closeNota}
              onChange={(e) => setCloseNota(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4 resize-none"
              rows={2}
              placeholder="Motivo adicional..."
            />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsClosing(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleCerrarCaso}
                disabled={!selectedClosingReason || cerrarLoading}
              >
                {cerrarLoading ? "Cerrando..." : "Cerrar caso"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Modal: Derivar a Chiclana */}
      {/* ================================================================ */}
      {isDerivar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsDerivar(false)} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Derivar a Chiclana</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se notificará a la sede de Medicina Nuclear y el caso se cerrará como derivado.
            </p>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Notas para Chiclana (opcional)</p>
            <textarea
              value={derivarNotas}
              onChange={(e) => setDerivarNotas(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4 resize-none"
              rows={3}
              placeholder="Información adicional para la derivación..."
            />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDerivar(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleDerivar} disabled={derivarLoading}>
                {derivarLoading ? "Derivando..." : "Confirmar derivación"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
