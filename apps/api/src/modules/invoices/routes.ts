import { Router } from "express";
import { createInvoiceSchema, updateInvoiceSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission, requireProjectAccess, projectScopeWhere } from "../../middleware/rbac";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);
router.use(requirePermission("VIEW_FINANCIALS"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, type, status } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const invoices = await prisma.invoice.findMany({
      where: {
        project: scope,
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(type ? { type: String(type) } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        consultantContract: { include: { consultant: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ invoices });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_FINANCIALS"),
  asyncHandler(async (req, res) => {
    const input = createInvoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: { ...input, createdById: req.user!.sub },
      include: { project: { select: { id: true, name: true } } },
    });
    await recordAudit({ userId: req.user!.sub, action: "CREATE", entityType: "Invoice", entityId: invoice.id });
    res.status(201).json({ invoice });
  })
);

router.patch(
  "/:id",
  requirePermission("MANAGE_FINANCIALS"),
  asyncHandler(async (req, res) => {
    const input = updateInvoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: input,
    });
    await recordAudit({
      userId: req.user!.sub,
      action: input.status === "PAID" ? "APPROVE" : "UPDATE",
      entityType: "Invoice",
      entityId: invoice.id,
      changes: input,
    });
    res.json({ invoice });
  })
);

export default router;
