import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { projectScopeWhere } from "../../middleware/rbac";

const router = Router();
router.use(requireAuth);

interface CalendarEvent {
  id: string;
  type: "MILESTONE" | "MEETING" | "SITE_VISIT" | "LEAVE" | "RFI_DUE";
  title: string;
  date: string;
  projectId?: string;
  projectName?: string;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const start = req.query.start ? new Date(String(req.query.start)) : new Date();
    const end = req.query.end ? new Date(String(req.query.end)) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const scope = await projectScopeWhere(req.user!);

    const [milestones, meetings, siteVisits, leaveRequests, rfis] = await Promise.all([
      prisma.milestone.findMany({
        where: { project: scope, dueDate: { gte: start, lte: end } },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.meeting.findMany({
        where: { project: scope, date: { gte: start, lte: end } },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.siteVisitLog.findMany({
        where: { project: scope, date: { gte: start, lte: end } },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.leaveRequest.findMany({
        where: {
          user: { officeId: req.user!.officeId },
          status: "APPROVED",
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.rFI.findMany({
        where: { project: scope, status: "OPEN", dueDate: { gte: start, lte: end } },
        include: { project: { select: { id: true, name: true } } },
      }),
    ]);

    const events: CalendarEvent[] = [
      ...milestones.map((m) => ({
        id: `milestone-${m.id}`,
        type: "MILESTONE" as const,
        title: m.title,
        date: m.dueDate.toISOString(),
        projectId: m.project.id,
        projectName: m.project.name,
      })),
      ...meetings.map((m) => ({
        id: `meeting-${m.id}`,
        type: "MEETING" as const,
        title: m.title,
        date: m.date.toISOString(),
        projectId: m.project.id,
        projectName: m.project.name,
      })),
      ...siteVisits.map((s) => ({
        id: `sitevisit-${s.id}`,
        type: "SITE_VISIT" as const,
        title: `Site visit`,
        date: s.date.toISOString(),
        projectId: s.project.id,
        projectName: s.project.name,
      })),
      ...leaveRequests.map((l) => ({
        id: `leave-${l.id}`,
        type: "LEAVE" as const,
        title: `${l.user.name} on leave (${l.type})`,
        date: l.startDate.toISOString(),
      })),
      ...rfis.map((r) => ({
        id: `rfi-${r.id}`,
        type: "RFI_DUE" as const,
        title: `RFI due: ${r.question.slice(0, 60)}`,
        date: (r.dueDate as Date).toISOString(),
        projectId: r.project.id,
        projectName: r.project.name,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ events });
  })
);

export default router;
