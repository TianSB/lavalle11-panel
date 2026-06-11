const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

/**
 * Format an ISO date string to a human-readable format in Spanish.
 * Example: "miércoles, 09/06 · 10:30"
 */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdayName = WEEKDAYS[d.getDay()] ?? "";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${weekdayName}, ${day}/${month} · ${hours}:${minutes}`;
}

/**
 * Get a list of suggested dates starting from tomorrow.
 * Each entry has a friendly label (e.g. "Mañana 10/06") and an ISO date string.
 */
export function getSuggestedDates(): { label: string; date: string }[] {
  const today = new Date();
  const suggestions: { label: string; date: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayName = WEEKDAYS[d.getDay()] ?? "";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const label =
      i === 1
        ? "Mañana"
        : dayName.charAt(0).toUpperCase() + dayName.slice(1);
    suggestions.push({
      label: `${label} ${day}/${month}`,
      date: d.toISOString().split("T")[0] ?? "",
    });
  }
  return suggestions;
}

/**
 * Format a Date/ISO string to a readable date for WhatsApp message preview.
 * Example: "miércoles 9/6"
 */
export function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dayName = WEEKDAYS[d.getDay()] ?? "";
  const day = d.getDate().toString();
  const month = (d.getMonth() + 1).toString();
  return `${dayName} ${day}/${month}`;
}

/**
 * Safe version of contact_name splitting.
 * Returns the first name or a fallback if the name is empty.
 */
export function getFirstName(fullName: string): string {
  const first = fullName.split(" ")[0];
  return first ?? fullName;
}

/**
 * Short format: "09/06"
 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}
