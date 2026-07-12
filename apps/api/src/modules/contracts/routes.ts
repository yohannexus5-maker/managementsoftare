import { Router } from "express";
import { createContractSchema, updateContractSchema, createPaymentMilestoneSchema, updatePaymentMilestoneSchema, Role } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission, requireProjectAccess, projectScopeWhere } from "../../middleware/rbac";
import { notFound } from "../../middleware/errors";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, consultantId } = req.query;
    const scope = await projectScopeWhere(req.user!);

    // A consultant portal user must only ever see their own firm's
    // contracts, never other consultants' fees on a shared project.
    let effectiveConsultantId = consultantId ? String(consultantId) : undefined;
    if (req.user!.role === Role.CONSULTANT) {
      const self = await prisma.user.findUnique({ where: { id: req.user!.sub } });
      effectiveConsultantId = self?.consultantId ?? "__none__";
    }

    const contracts = await prisma.consultantContract.findMany({
      where: {
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(effectiveConsultantId ? { consultantId: effectiveConsultantId } : {}),
        project: scope,
      },
      include: {
        consultant: true,
        project: { select: { id: true, name: true } },
        paymentMilestones: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ contracts });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res) => {
    const input = createContractSchema.parse(req.body);
    const contract = await prisma.consultantContract.create({
      data: input,
      include: { consultant: true, paymentMilestones: true },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "CREATE",
      entityType: "ConsultantContract",
      entityId: contract.id,
    });
    res.status(201).json({ contract });
  })
);

router.patch(
  "/:id",
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.consultantContract.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Contract not found"));
    const input = updateContractSchema.partial().parse(req.body);
    const contract = await prisma.consultantContract.update({
      where: { id: req.params.id },
      data: input,
      include: { consultant: true, paymentMilestones: true },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "ConsultantContract",
      entityId: contract.id,
      changes: input,
    });
    res.json({ contract });
  })
);

router.post(
  "/:id/payment-milestones",
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res) => {
    const input = createPaymentMilestoneSchema.parse({ ...req.body, contractId: req.params.id });
    const milestone = await prisma.paymentMilestone.create({ data: input });
    res.status(201).json({ milestone });
  })
);

router.patch(
  "/payment-milestones/:milestoneId",
  requirePermission("MANAGE_CONSULTANTS"),
  asyncHandler(async (req, res) => {
    const input = updatePaymentMilestoneSchema.parse(req.body);
    const milestone = await prisma.paymentMilestone.update({
      where: { id: req.params.milestoneId },
      data: input,
    });
    res.json({ milestone });
  })
);

export default router;
