import { useState, useCallback, useRef } from "react";
import type { Caso, Sede, Instruccion } from "../../types";
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
import { TIPOS_CASO } from "../../data/mockCases";
import { formatDateTime } from "../../utils/dates";

interface CaseModalProps {
  caso: Caso | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CaseModal({ caso, isOpen, onClose }: CaseModalProps) {
  const [selectedSede, setSelectedSede] = useState<Sede>("lavalle11");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedInstrucciones, setSelectedInstrucciones] = useState<Instruccion[]>([]);
  const [seguimientoNota, setSeguimientoNota] = useState("");
  const [seguimientoFecha, setSeguimientoFecha] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevCasoIdRef = useRef(caso?.id);

  // Reset state when a new case is opened (ref-based to avoid stale closure)
  if (caso && caso.id !== prevCasoIdRef.current) {
    prevCasoIdRef.current = caso.id;
    setSelectedSede("lavalle11");
    setSelectedDate("");
    setSelectedTime("09:00");
    setSelectedInstrucciones([]);
    setSeguimientoNota("");
    setSeguimientoFecha("");
    setIsSending(false);
    setIsClosing(false);
  }

  const toggleInstruccion = useCallback((inst: Instruccion) => {
    setSelectedInstrucciones((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  }, []);

  const handleSend = useCallback(() => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      showToast("Mensaje enviado correctamente", "success");
    }, 1000);
  }, []);

  const handleCloseCase = useCallback(() => {
    setIsClosing(true);
  }, []);

  const confirmClose = useCallback(() => {
    showToast("Caso cerrado correctamente", "success");
    setIsClosing(false);
    onClose();
  }, [onClose]);

  const cancelClose = useCallback(() => {
    setIsClosing(false);
  }, []);

  if (!caso) return null;

  const isPendiente = caso.asesor_id === null;
  const tipoCasoLabel = TIPOS_CASO[caso.tipo_caso] ?? null;

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
            <Button size="sm" onClick={() => showToast("Caso asignado a tu bandeja", "success")}>
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

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              onClick={handleSend}
              disabled={!selectedDate || !selectedTime || isSending}
            >
              {isSending ? "Enviando..." : "Enviar mensaje"}
            </Button>
            <Button variant="ghost" onClick={handleCloseCase}>
              Cerrar caso
            </Button>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Confirm close dialog */}
      {isClosing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={cancelClose} />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">¿Cerrar caso?</h3>
            <p className="text-sm text-gray-500 mb-6">
              El caso se marcará como cerrado. Esta acción puede deshacerse si es necesario.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={cancelClose}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmClose}>
                Cerrar caso
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
