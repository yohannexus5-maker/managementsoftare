import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import { RequireAuth, RequireInternalRole } from "../auth/guards";
import LoginPage from "../pages/LoginPage";
import HomeRouter from "../pages/HomeRouter";
import PortalPage from "../pages/portal/PortalPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import ProjectsListPage from "../pages/projects/ProjectsListPage";
import ProjectDetailPage from "../pages/projects/ProjectDetailPage";
import TimelinePage from "../pages/projects/TimelinePage";
import ConsultantsListPage from "../pages/consultants/ConsultantsListPage";
import ConsultantDetailPage from "../pages/consultants/ConsultantDetailPage";
import TeamPage from "../pages/team/TeamPage";
import TasksPage from "../pages/tasks/TasksPage";
import TimesheetsPage from "../pages/timesheets/TimesheetsPage";
import FinancialsPage from "../pages/financials/FinancialsPage";
import CalendarPage from "../pages/calendar/CalendarPage";
import SearchPage from "../pages/search/SearchPage";
import ReportsPage from "../pages/reports/ReportsPage";
import AdminPage from "../pages/admin/AdminPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRouter /> },
      { path: "portal", element: <PortalPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      {
        element: <RequireInternalRole />,
        children: [
          { path: "projects", element: <ProjectsListPage /> },
          { path: "projects/timeline", element: <TimelinePage /> },
          { path: "projects/:id", element: <ProjectDetailPage /> },
          { path: "consultants", element: <ConsultantsListPage /> },
          { path: "consultants/:id", element: <ConsultantDetailPage /> },
          { path: "team", element: <TeamPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "timesheets", element: <TimesheetsPage /> },
          { path: "financials", element: <FinancialsPage /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "search", element: <SearchPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "admin", element: <AdminPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
