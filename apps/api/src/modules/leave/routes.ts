import { Router } from "express";
import { createLeaveRequestSchema, decideLeaveRequestSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { forbidden } from "../../middleware/errors";
import { notify } from "../../lib/notify";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { mine, status } = req.query;
    const isManager = ["PRINCIPAL", "PROJECT_ARCHITECT", "ADMIN_MANAGER"].includes(req.user!.role);

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        user: { officeId: req.user!.officeId },
        ...(mine === "true" || !isManager ? { userId: req.user!.sub } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ leaveRequests });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createLeaveRequestSchema.parse(req.body);
    const leaveRequest = await prisma.leaveRequest.create({
      data: { ...input, userId: req.user!.sub },
    });

    const managers = await prisma.user.findMany({
      where: { officeId: req.user!.officeId, role: { in: ["PRINCIPAL", "ADMIN_MANAGER"] } },
    });
    await Promise.all(
      managers.map((m) =>
        notify({
          userId: m.id,
          type: "LEAVE_REQUESTED",
          title: `Leave request pending approval`,
          link: "/timesheets?tab=leave",
        })
      )
    );

    res.status(201).json({ leaveRequest });
  })
);

router.patch(
  "/:id/decide",
  requirePermission("APPROVE_LEAVE"),
  asyncHandler(async (req, res, next) => {
    const input = decideLeaveRequestSchema.parse(req.body);
    const existing = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(forbidden("Leave request not found"));

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { ...input, decidedById: req.user!.sub },
    });

    await notify({
      userId: leaveRequest.userId,
      type: "LEAVE_DECIDED",
      title: `Your leave request was ${input.status.toLowerCase()}`,
      link: "/timesheets?tab=leave",
    });

    res.json({ leaveRequest });
  })
);

export default router;
