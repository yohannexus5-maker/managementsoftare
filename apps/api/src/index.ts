import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errors";

import authRoutes from "./modules/auth/routes";
import notificationRoutes from "./modules/notifications/routes";
import projectRoutes from "./modules/projects/routes";
import clientRoutes from "./modules/clients/routes";
import teamRoutes from "./modules/team/routes";
import consultantRoutes from "./modules/consultants/routes";
import contractRoutes from "./modules/contracts/routes";
import deliverableRoutes from "./modules/deliverables/routes";
import meetingRoutes from "./modules/meetings/routes";
import taskRoutes from "./modules/tasks/routes";
import timesheetRoutes from "./modules/timesheets/routes";
import leaveRoutes from "./modules/leave/routes";
import drawingRoutes from "./modules/drawings/routes";
import rfiRoutes from "./modules/rfis/routes";
import siteVisitRoutes from "./modules/sitevisits/routes";
import documentRoutes from "./modules/documents/routes";
import invoiceRoutes from "./modules/invoices/routes";
import financialsRoutes from "./modules/financials/routes";
import approvalRoutes from "./modules/approvals/routes";
import dashboardRoutes from "./modules/dashboard/routes";
import calendarRoutes from "./modules/calendar/routes";
import searchRoutes from "./modules/search/routes";
import auditRoutes from "./modules/audit/routes";
import reportRoutes from "./modules/reports/routes";
import adminRoutes from "./modules/admin/routes";

const app = express();

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/deliverables", deliverableRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/drawings", drawingRoutes);
app.use("/api/rfis", rfiRoutes);
app.use("/api/sitevisits", siteVisitRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/financials", financialsRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`APMS API listening on http://localhost:${port}`);
});
