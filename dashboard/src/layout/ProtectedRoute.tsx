import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While auth is being restored, show a small loader (prevents bounce)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  // Rely only on context user (do NOT read from local/session storage here)
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
