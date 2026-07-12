import { Router } from "express";
import { createConsultantSchema, updateConsultantSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { notFound } from "../../middleware/errors";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    const consultants = await prisma.consultant.findMany({
      where: {
        officeId: req.user!.officeId,
        ...(category ? { category: String(category) } : {}),
      },
      include: { _count: { select: { contracts: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ consultants });
  })
);

router.post(
  "/",
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res) => {
    const input = createConsultantSchema.parse(req.body);
    const consultant = await prisma.consultant.create({
      data: { ...input, officeId: req.user!.officeId },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "CREATE",
      entityType: "Consultant",
      entityId: consultant.id,
    });
    res.status(201).json({ consultant });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const consultant = await prisma.consultant.findFirst({
      where: { id: req.params.id, officeId: req.user!.officeId },
      include: {
        contracts: {
          include: { project: { select: { id: true, name: true } }, paymentMilestones: true },
          orderBy: { createdAt: "desc" },
        },
        deliverables: { include: { project: { select: { id: true, name: true } } } },
        drawingsExchanged: { include: { project: { select: { id: true, name: true } } } },
        rfis: { include: { project: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!consultant) return next(notFound("Consultant not found"));
    res.json({ consultant });
  })
);

router.patch(
  "/:id",
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res) => {
    const input = updateConsultantSchema.parse(req.body);
    const consultant = await prisma.consultant.update({
      where: { id: req.params.id },
      data: input,
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "Consultant",
      entityId: consultant.id,
      changes: input,
    });
    res.json({ consultant });
  })
);

export default router;
