import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase()?.trim();

  if (allowedRoles && !allowedRoles.map((r) => r.toLowerCase()).includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}