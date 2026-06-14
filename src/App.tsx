import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CasoServiceProvider } from "./context/CasoServiceContext";
import { CaseUIStoreProvider } from "./context/CaseUIStoreContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ToastContainer } from "./components/ui/Toast";
import { supabase } from "./lib/supabase";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug: verify auth state in production
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.warn("AUTH DEBUG — getUser error:", error.message);
      } else if (!data.user) {
        console.warn("AUTH DEBUG — getUser returned null (no active session)");
      } else {
        console.log("AUTH DEBUG — User authenticated:", {
          id: data.user.id,
          email: data.user.email,
          aud: data.user.aud,
          role: data.user.role,
        });
      }
    });
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <CasoServiceProvider>
        <CaseUIStoreProvider>
          <AppContent />
        </CaseUIStoreProvider>
      </CasoServiceProvider>
      <ToastContainer />
    </AuthProvider>
  );
}
