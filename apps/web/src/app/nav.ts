import {
  LayoutDashboard,
  Building2,
  Users,
  KanbanSquare,
  Clock,
  CalendarDays,
  Wallet,
  FileBarChart,
  Settings,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@apms/shared";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM, Role.ADMIN_MANAGER],
  },
  {
    label: "Projects",
    to: "/projects",
    icon: Building2,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM, Role.ADMIN_MANAGER],
  },
  {
    label: "Consultants",
    to: "/consultants",
    icon: Users,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.ADMIN_MANAGER],
  },
  {
    label: "Team",
    to: "/team",
    icon: Users,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.ADMIN_MANAGER],
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: KanbanSquare,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM],
  },
  {
    label: "Timesheets & Leave",
    to: "/timesheets",
    icon: Clock,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM, Role.ADMIN_MANAGER],
  },
  {
    label: "Calendar",
    to: "/calendar",
    icon: CalendarDays,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM, Role.ADMIN_MANAGER],
  },
  {
    label: "Financials",
    to: "/financials",
    icon: Wallet,
    roles: [Role.PRINCIPAL, Role.ADMIN_MANAGER],
  },
  {
    label: "Reports",
    to: "/reports",
    icon: FileBarChart,
    roles: [Role.PRINCIPAL, Role.ADMIN_MANAGER],
  },
  {
    label: "Search",
    to: "/search",
    icon: Search,
    roles: [Role.PRINCIPAL, Role.PROJECT_ARCHITECT, Role.DESIGN_TEAM, Role.ADMIN_MANAGER],
  },
  {
    label: "Admin",
    to: "/admin",
    icon: Settings,
    roles: [Role.PRINCIPAL, Role.ADMIN_MANAGER],
  },
];

export const PORTAL_NAV_ITEMS: NavItem[] = [
  {
    label: "My Portal",
    to: "/portal",
    icon: LayoutDashboard,
    roles: [Role.CONSULTANT, Role.CLIENT],
  },
];
