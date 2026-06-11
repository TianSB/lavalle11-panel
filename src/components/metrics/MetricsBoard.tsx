import { MOCK_METRICAS, MOCK_CASOS_POR_TIPO, MOCK_VOLUMEN_DIARIO } from "../../data/mockCases";

export function MetricsBoard() {
  const metricas = MOCK_METRICAS;
  const porTipo = MOCK_CASOS_POR_TIPO;
  const volumenDiario = MOCK_VOLUMEN_DIARIO;
  const maxTipo = Math.max(...porTipo.map((t) => t.cantidad), 1);
  const maxVolumen = Math.max(...volumenDiario.map((v) => v.total), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Dashboard de Métricas</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Casos activos"
          value={metricas.casos_activos}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />
        <KPICard
          label="Casos hoy"
          value={metricas.casos_hoy}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="indigo"
        />
        <KPICard
          label="Sin asignar"
          value={metricas.casos_sin_asignar}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="amber"
        />
        <KPICard
          label="Sin atender 24hs"
          value={metricas.casos_sin_atender_24hs}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
          urgent
        />
        <KPICard
          label="Tiempo promedio"
          value={`${metricas.tiempo_promedio_resolucion_min}m`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="purple"
        />
        <KPICard
          label="Resolución automática"
          value={`${Math.round(metricas.tasa_resolucion_automatica * 100)}%`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Casos por tipo */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Casos por tipo</h3>
          <div className="space-y-2.5">
            {porTipo.map((t) => (
              <div key={t.tipo}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">
                    <span className="font-mono font-medium text-gray-800">Tipo {t.tipo}</span> — {t.nombre}
                  </span>
                  <span className="font-semibold text-gray-800">{t.cantidad}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(t.cantidad / maxTipo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volumen diario */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Volumen diario (últimos 7 días)</h3>
          <div className="flex items-end gap-2 h-40">
            {volumenDiario.map((v) => (
              <div key={v.fecha} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                {/* Stacked bars */}
                <div className="flex w-full flex-col items-center justify-end gap-0.5 h-32">
                  <div
                    className="w-full rounded-t-sm bg-emerald-400 transition-all"
                    style={{ height: `${(v.resueltos / maxVolumen) * 100}%` }}
                    title={`Resueltos: ${v.resueltos}`}
                  />
                  <div
                    className="w-full rounded-sm bg-blue-400 transition-all"
                    style={{ height: `${((v.total - v.resueltos) / maxVolumen) * 100}%` }}
                    title={`Pendientes: ${v.total - v.resueltos}`}
                  />
                </div>
                {/* Auto indicator */}
                {v.automaticos > 0 && (
                  <div className="flex items-center gap-0.5">
                    <svg className="h-2.5 w-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-medium text-emerald-600">{v.automaticos}</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 mt-1">
                  {new Date(v.fecha).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
              <span>Nuevos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
              <span>Resueltos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Automáticos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
  urgent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "indigo" | "amber" | "red" | "purple" | "green";
  urgent?: boolean;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  const borderMap: Record<string, string> = {
    blue: "border-blue-200",
    indigo: "border-indigo-200",
    amber: "border-amber-200",
    red: "border-red-200",
    purple: "border-purple-200",
    green: "border-emerald-200",
  };

  return (
    <div className={`relative rounded-xl border bg-white p-4 ${borderMap[color]} ${urgent && Number(value) > 0 ? "ring-2 ring-red-300" : ""}`}>
      {urgent && Number(value) > 0 && (
        <div className="absolute -top-1.5 -right-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            !
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`rounded-lg p-1.5 ${bgMap[color]}`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${urgent && Number(value) > 0 ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
