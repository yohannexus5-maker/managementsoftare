import { Router } from "express";
import { createTimesheetSchema, updateTimesheetSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere } from "../../middleware/rbac";
import { forbidden } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, projectId, approvalStatus, mine } = req.query;
    const targetUserId = mine === "true" ? req.user!.sub : userId ? String(userId) : undefined;
    const scope = await projectScopeWhere(req.user!);

    const timesheets = await prisma.timesheet.findMany({
      where: {
        project: scope,
        ...(targetUserId ? { userId: targetUserId } : {}),
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(approvalStatus ? { approvalStatus: String(approvalStatus) } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json({ timesheets });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createTimesheetSchema.parse(req.body);
    const timesheet = await prisma.timesheet.create({
      data: { ...input, userId: req.user!.sub },
      include: { project: { select: { id: true, name: true } }, task: { select: { id: true, title: true } } },
    });
    res.status(201).json({ timesheet });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(forbidden("Timesheet not found"));

    const isApprovalChange = req.body.approvalStatus !== undefined;
    if (isApprovalChange && existing.userId === req.user!.sub) {
      return next(forbidden("Cannot approve your own timesheet"));
    }
    if (isApprovalChange && !["PRINCIPAL", "PROJECT_ARCHITECT", "ADMIN_MANAGER"].includes(req.user!.role)) {
      return next(forbidden("Not authorized to approve timesheets"));
    }
    if (!isApprovalChange && existing.userId !== req.user!.sub) {
      return next(forbidden("Cannot edit another user's timesheet"));
    }

    const input = updateTimesheetSchema.parse(req.body);
    const timesheet = await prisma.timesheet.update({
      where: { id: req.params.id },
      data: {
        ...input,
        ...(isApprovalChange ? { approvedById: req.user!.sub } : {}),
      },
    });
    res.json({ timesheet });
  })
);

export default router;
