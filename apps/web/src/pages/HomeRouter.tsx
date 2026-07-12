import { PORTAL_ROLES } from "@apms/shared";
import { useAuth } from "../auth/AuthContext";
import DashboardPage from "./DashboardPage";
import PortalPage from "./portal/PortalPage";

export default function HomeRouter() {
  const { user } = useAuth();
  if (user && PORTAL_ROLES.includes(user.role)) return <PortalPage />;
  return <DashboardPage />;
}
