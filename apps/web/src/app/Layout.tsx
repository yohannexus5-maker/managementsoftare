import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, LogOut, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../auth/AuthContext";
import { NAV_ITEMS, PORTAL_NAV_ITEMS } from "./nav";
import { PORTAL_ROLES } from "@apms/shared";
import { useNotificationsSummary } from "../features/notifications/hooks";

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "Principal",
  PROJECT_ARCHITECT: "Project Architect",
  DESIGN_TEAM: "Design Team",
  ADMIN_MANAGER: "Admin Manager",
  CONSULTANT: "Consultant",
  CLIENT: "Client",
};

export function Layout() {
  const { user, logout } = useAuth();
  const isPortal = user ? PORTAL_ROLES.includes(user.role) : false;
  const items = isPortal ? PORTAL_NAV_ITEMS : NAV_ITEMS.filter((i) => user && i.roles.includes(user.role));
  const { data: unread } = useNotificationsSummary();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-ink-200 bg-white flex flex-col transition-transform duration-200 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-200">
          <div>
            <div className="text-sm uppercase tracking-wide text-ink-400">Studio Meridian</div>
            <div className="text-lg font-semibold text-ink-900">Practice Platform</div>
          </div>
          <button className="text-ink-400 hover:text-ink-700 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                )
              }
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-200">
          <div className="px-3 py-2">
            <div className="text-sm font-medium text-ink-900">{user?.name}</div>
            <div className="text-xs text-ink-500">{user && ROLE_LABELS[user.role]}</div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-100"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-ink-200 bg-white flex items-center justify-between px-4 gap-4 md:justify-end md:px-6">
          <button className="text-ink-600 hover:text-ink-900 md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <NavLink to="/notifications" className="relative rounded-full p-2 hover:bg-ink-100">
            <Bell size={19} strokeWidth={1.75} className="text-ink-600" />
            {!!unread && unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </NavLink>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
