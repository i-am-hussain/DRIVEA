import React from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui/Spinner";
import Login, { Register } from "./pages/Login";
import Drive from "./pages/Drive";
import Trash from "./pages/Trash";
import SharedWithMe from "./pages/SharedWithMe";
import SharedFile from "./pages/SharedFile";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner size="lg" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

const App = () => {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 3200,
          style: {
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "13px",
            fontWeight: 500,
            padding: "10px 14px",
            boxShadow: "0 12px 32px -8px rgba(15, 23, 42, 0.18)",
          },
          success: { iconTheme: { primary: "#ea580c", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/s/:token" element={<SharedFile />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Drive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/f/:id"
          element={
            <ProtectedRoute>
              <Drive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <Trash />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shared"
          element={
            <ProtectedRoute>
              <SharedWithMe />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
