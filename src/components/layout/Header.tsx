interface HeaderProps {
  asesorNombre: string;
  asesorRol: string;
  onLogout: () => void;
}

export function Header({ asesorNombre, asesorRol, onLogout }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
          L11
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Instituto Lavalle 11</h1>
          <p className="text-xs text-gray-500">Panel de Gestión de Turnos</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{asesorNombre}</p>
          <p className="text-xs text-gray-500">{asesorRol === "administrador" ? "Administrador" : "Asesor"}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Cerrar sesión"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
