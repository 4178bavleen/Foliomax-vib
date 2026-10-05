import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token =
    localStorage.getItem("foliomax_accessToken") ||
    sessionStorage.getItem("foliomax_accessToken");

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
