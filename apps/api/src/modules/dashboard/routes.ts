import { Router } from "express";
import { INTERNAL_ROLES, Role } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { projectScopeWhere } from "../../middleware/rbac";

const router = Router();
router.use(requireAuth);

const OFFICE_WIDE_ROLES: string[] = [Role.PRINCIPAL, Role.ADMIN_MANAGER];

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const scope = await projectScopeWhere(user);
    const now = new Date();
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [activeProjectsCount, upcomingMilestones, overdueMilestones, overdueTasks, overdueRfis, pendingDeliverables, todaysMeetings, myPendingApprovals] =
      await Promise.all([
        prisma.project.count({ where: { ...scope, status: "ACTIVE" } }),
        prisma.milestone.findMany({
          where: { project: scope, status: { not: "DONE" }, dueDate: { gte: now, lte: in14Days } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.milestone.findMany({
          where: { project: scope, status: { not: "DONE" }, dueDate: { lt: now } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.task.findMany({
          where: { project: scope, status: { not: "DONE" }, dueDate: { lt: now } },
          include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.rFI.findMany({
          where: { project: scope, status: "OPEN", dueDate: { lt: now } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.deliverable.findMany({
          where: {
            project: scope,
            ownerType: "CONSULTANT",
            status: { notIn: ["APPROVED"] },
            dueDate: { lte: in14Days },
          },
          include: { project: { select: { id: true, name: true } }, consultant: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.meeting.findMany({
          where: { project: scope, date: { gte: todayStart, lt: todayEnd } },
          include: { project: { select: { id: true, name: true } } },
        }),
        prisma.approvalRequest.findMany({
          where: { status: "PENDING" },
          include: { requestedBy: { select: { id: true, name: true } } },
        }),
      ]);

    const myApprovals = myPendingApprovals.filter((r) => r.rolesCsv.split(",")[r.currentStepIndex] === user.role);

    let kpis: Record<string, unknown> | undefined;
    if (OFFICE_WIDE_ROLES.includes(user.role)) {
      const projects = await prisma.project.findMany({ where: { officeId: user.officeId } });
      const revenueByTypology: Record<string, number> = {};
      projects.forEach((p) => {
        revenueByTypology[p.typology] = (revenueByTypology[p.typology] ?? 0) + (p.fee ?? 0);
      });

      const completedWithDates = projects.filter((p) => p.startDate && p.endDate);
      const avgProjectDurationDays = completedWithDates.length
        ? Math.round(
            completedWithDates.reduce(
              (sum, p) => sum + (new Date(p.endDate!).getTime() - new Date(p.startDate!).getTime()) / 86400000,
              0
            ) / completedWithDates.length
          )
        : 0;

      const pastMilestones = await prisma.milestone.count({
        where: { project: { officeId: user.officeId }, dueDate: { lt: now } },
      });
      const pastMilestonesOnTime = await prisma.milestone.count({
        where: { project: { officeId: user.officeId }, dueDate: { lt: now }, status: "DONE" },
      });
      const onTimeDeliveryRate = pastMilestones ? Math.round((pastMilestonesOnTime / pastMilestones) * 100) : 100;

      const members = await prisma.user.findMany({
        where: { officeId: user.officeId, role: { in: INTERNAL_ROLES }, active: true },
      });
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const hoursSums = await Promise.all(
        members.map((m) =>
          prisma.timesheet.aggregate({ where: { userId: m.id, date: { gte: weekAgo } }, _sum: { hours: true } })
        )
      );
      const avgUtilizationPct = members.length
        ? Math.round(
            hoursSums.reduce((sum, h) => sum + ((h._sum.hours ?? 0) / 40) * 100, 0) / members.length
          )
        : 0;

      kpis = {
        revenueByTypology,
        avgProjectDurationDays,
        onTimeDeliveryRate,
        teamUtilizationRate: avgUtilizationPct,
        totalRevenue: projects.reduce((sum, p) => sum + (p.fee ?? 0), 0),
      };
    }

    res.json({
      activeProjectsCount,
      upcomingMilestones,
      overdueMilestones,
      overdueTasks,
      overdueRfis,
      pendingDeliverables,
      todaysMeetings,
      myPendingApprovals: myApprovals,
      kpis,
    });
  })
);

export default router;
