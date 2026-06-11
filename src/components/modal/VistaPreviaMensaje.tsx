import { useMemo } from "react";
import type { Caso, Sede, Instruccion } from "../../types";
import { formatMessageDate, getFirstName } from "../../utils/dates";
import { showToast } from "../ui/Toast";
import { INSTRUCCION_LABELS } from "./ListaInstrucciones";

interface VistaPreviaMensajeProps {
  caso: Caso;
  selectedDate: string;
  selectedTime: string;
  selectedSede: Sede;
  selectedInstrucciones: Instruccion[];
}

export function VistaPreviaMensaje({
  caso,
  selectedDate,
  selectedTime,
  selectedSede,
  selectedInstrucciones,
}: VistaPreviaMensajeProps) {
  const mensaje = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;

    const dateFormatted = formatMessageDate(selectedDate);
    const firstName = getFirstName(caso.contact_name);

    const instruccionesText =
      selectedInstrucciones.length > 0
        ? `\n\n📋 Recordá:\n${selectedInstrucciones.map((i) => `• ${INSTRUCCION_LABELS[i]}`).join("\n")}`
        : "";

    const sedeText =
      selectedSede === "lavalle11"
        ? "Lavalle 11"
        : "Chiclana (Medicina Nuclear)";

    return (
      `✅ *Turno confirmado - Instituto Lavalle 11*\n\n` +
      `Hola ${firstName} 👋\n\n` +
      `Te confirmamos tu turno para *${caso.extraccion_ia.practica}*:\n\n` +
      `📅 *Fecha:* ${dateFormatted}\n` +
      `⏰ *Horario:* ${selectedTime} hs\n` +
      `📍 *Sede:* ${sedeText}${instruccionesText}\n\n` +
      `📱 Ante cualquier cambio comunicate al 291-456-7890\n\n` +
      `¡Gracias por confiar en nosotros! 🙌`
    );
  }, [selectedDate, selectedTime, selectedInstrucciones, selectedSede, caso]);

  const handleCopy = () => {
    if (mensaje) {
      navigator.clipboard.writeText(mensaje);
      showToast("Copiado al portapapeles", "info");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Vista previa del mensaje
        </p>
        {mensaje && (
          <button
            onClick={handleCopy}
            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Copiar
          </button>
        )}
      </div>
      <div className="min-h-[120px] rounded-lg border border-gray-200 bg-gray-50 p-4">
        {mensaje ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {mensaje}
          </pre>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Seleccioná fecha y horario para ver la vista previa del mensaje
          </p>
        )}
      </div>
    </div>
  );
}
