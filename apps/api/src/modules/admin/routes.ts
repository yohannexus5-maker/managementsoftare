import { Router } from "express";
import { ALL_ROLES } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { recordAudit } from "../../lib/audit";
import { notFound } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);
router.use(requirePermission("MANAGE_ADMIN_CONFIG"));

// ---- Phase templates ----

router.get(
  "/phase-templates",
  asyncHandler(async (req, res) => {
    const items = await prisma.phaseTemplate.findMany({
      where: { officeId: req.user!.officeId },
      orderBy: { order: "asc" },
    });
    res.json({ items });
  })
);

router.post(
  "/phase-templates",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name: string };
    const maxOrder = await prisma.phaseTemplate.aggregate({
      where: { officeId: req.user!.officeId },
      _max: { order: true },
    });
    const item = await prisma.phaseTemplate.create({
      data: { officeId: req.user!.officeId, name, order: (maxOrder._max.order ?? -1) + 1 },
    });
    res.status(201).json({ item });
  })
);

router.delete(
  "/phase-templates/:id",
  asyncHandler(async (req, res) => {
    await prisma.phaseTemplate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// ---- Consultant categories ----

router.get(
  "/consultant-categories",
  asyncHandler(async (req, res) => {
    const items = await prisma.consultantCategoryConfig.findMany({
      where: { officeId: req.user!.officeId },
      orderBy: { name: "asc" },
    });
    res.json({ items });
  })
);

router.post(
  "/consultant-categories",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name: string };
    const item = await prisma.consultantCategoryConfig.create({
      data: { officeId: req.user!.officeId, name },
    });
    res.status(201).json({ item });
  })
);

router.delete(
  "/consultant-categories/:id",
  asyncHandler(async (req, res) => {
    await prisma.consultantCategoryConfig.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// ---- Statutory checklist templates ----

router.get(
  "/statutory-templates",
  asyncHandler(async (req, res) => {
    const items = await prisma.statutoryChecklistTemplate.findMany({
      where: { officeId: req.user!.officeId },
      orderBy: { name: "asc" },
    });
    res.json({ items });
  })
);

router.post(
  "/statutory-templates",
  asyncHandler(async (req, res) => {
    const { name, jurisdiction } = req.body as { name: string; jurisdiction?: string };
    const item = await prisma.statutoryChecklistTemplate.create({
      data: { officeId: req.user!.officeId, name, jurisdiction },
    });
    res.status(201).json({ item });
  })
);

router.delete(
  "/statutory-templates/:id",
  asyncHandler(async (req, res) => {
    await prisma.statutoryChecklistTemplate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// ---- Approval chains ----

const CHAIN_ENTITY_TYPES = ["DRAWING", "INVOICE", "CONTRACT"];
const DEFAULT_CHAINS: Record<string, string> = {
  DRAWING: "PROJECT_ARCHITECT,PRINCIPAL",
  INVOICE: "ADMIN_MANAGER,PRINCIPAL",
  CONTRACT: "PRINCIPAL",
};

router.get(
  "/approval-chains",
  asyncHandler(async (req, res) => {
    const configs = await prisma.approvalChainConfig.findMany({ where: { officeId: req.user!.officeId } });
    const byType = Object.fromEntries(configs.map((c) => [c.entityType, c]));
    const items = CHAIN_ENTITY_TYPES.map((entityType) => ({
      entityType,
      id: byType[entityType]?.id,
      rolesCsv: byType[entityType]?.rolesCsv ?? DEFAULT_CHAINS[entityType],
    }));
    res.json({ items });
  })
);

router.put(
  "/approval-chains/:entityType",
  asyncHandler(async (req, res) => {
    const { rolesCsv } = req.body as { rolesCsv: string };
    const item = await prisma.approvalChainConfig.upsert({
      where: { officeId_entityType: { officeId: req.user!.officeId, entityType: req.params.entityType } },
      create: { officeId: req.user!.officeId, entityType: req.params.entityType, rolesCsv },
      update: { rolesCsv },
    });
    res.json({ item });
  })
);

// ---- Users (HR) ----

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { officeId: req.user!.officeId },
      select: { id: true, name: true, email: true, role: true, seniority: true, active: true },
      orderBy: { name: "asc" },
    });
    res.json({ users, roles: ALL_ROLES });
  })
);

router.patch(
  "/users/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("User not found"));
    const { active, role, seniority } = req.body as { active?: boolean; role?: string; seniority?: string };
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active, role, seniority },
      select: { id: true, name: true, email: true, role: true, seniority: true, active: true },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      changes: req.body,
    });
    res.json({ user });
  })
);

export default router;
