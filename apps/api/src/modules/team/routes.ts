import { Router } from "express";
import { createUserSchema, updateUserSchema, INTERNAL_ROLES } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { hashPassword } from "../../lib/password";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);

router.get(
  "/members",
  asyncHandler(async (req, res) => {
    const members = await prisma.user.findMany({
      where: { officeId: req.user!.officeId, role: { in: INTERNAL_ROLES }, active: true },
      select: { id: true, name: true, email: true, role: true, seniority: true, skills: true },
      orderBy: { name: "asc" },
    });
    res.json({ members });
  })
);

router.get(
  "/skills",
  asyncHandler(async (_req, res) => {
    const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
    res.json({ skills });
  })
);

const WEEK_CAPACITY_HOURS = 40;

router.get(
  "/workload",
  asyncHandler(async (req, res) => {
    const officeId = req.user!.officeId;
    const members = await prisma.user.findMany({
      where: { officeId, role: { in: INTERNAL_ROLES }, active: true },
      select: { id: true, name: true, role: true },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const workload = await Promise.all(
      members.map(async (m) => {
        const [activeTaskCount, hoursResult, activeProjectCount] = await Promise.all([
          prisma.task.count({ where: { assigneeId: m.id, status: { not: "DONE" } } }),
          prisma.timesheet.aggregate({
            where: { userId: m.id, date: { gte: weekAgo } },
            _sum: { hours: true },
          }),
          prisma.projectMember.count({ where: { userId: m.id, project: { status: "ACTIVE" } } }),
        ]);
        const hoursLastWeek = hoursResult._sum.hours ?? 0;
        const utilizationPct = Math.round((hoursLastWeek / WEEK_CAPACITY_HOURS) * 100);
        return {
          ...m,
          activeTaskCount,
          activeProjectCount,
          hoursLastWeek,
          utilizationPct,
          flag: utilizationPct > 100 ? "OVER_ALLOCATED" : utilizationPct < 40 ? "UNDER_ALLOCATED" : "NORMAL",
        };
      })
    );

    res.json({ workload });
  })
);

router.post(
  "/members",
  requirePermission("MANAGE_HR"),
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const { skillIds, password, ...rest } = input;
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        officeId: req.user!.officeId,
        skills: skillIds ? { connect: skillIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, name: true, email: true, role: true, seniority: true, active: true },
    });
    await recordAudit({ userId: req.user!.sub, action: "CREATE", entityType: "User", entityId: user.id });
    res.status(201).json({ member: user });
  })
);

router.patch(
  "/members/:id",
  requirePermission("MANAGE_HR"),
  asyncHandler(async (req, res) => {
    const input = updateUserSchema.parse(req.body);
    const { skillIds, password, ...rest } = input;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
        ...(skillIds ? { skills: { set: skillIds.map((id) => ({ id })) } } : {}),
      },
      select: { id: true, name: true, email: true, role: true, seniority: true, active: true },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      changes: rest,
    });
    res.json({ member: user });
  })
);

export default router;
