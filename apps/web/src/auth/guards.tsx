import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { INTERNAL_ROLES, type Permission, type Role } from "@apms/shared";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Layout-route guard for the internal-staff route tree. Portal roles
 * (Consultant/Client) are redirected to their portal — the backend also
 * enforces this per-endpoint, but pages shouldn't even render their shell
 * for a role that can see none of the underlying data.
 */
export function RequireInternalRole() {
  const { user } = useAuth();
  if (!user || !INTERNAL_ROLES.includes(user.role)) return <Navigate to="/portal" replace />;
  return <Outlet />;
}
