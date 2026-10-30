import { isAdminAuthenticated } from "@/lib/admin-session";
import { Navigate, Outlet } from "react-router-dom";

export function RequireAdmin() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/administration" replace />;
  }
  return <Outlet />;
}
