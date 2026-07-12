import { Router } from "express";
import {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  updateStatutoryItemSchema,
} from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission, requireProjectAccess, projectScopeWhere } from "../../middleware/rbac";
import { notFound } from "../../middleware/errors";
import { recordAudit } from "../../lib/audit";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const PROJECT_DETAIL_INCLUDE = {
  client: true,
  leadArchitect: { select: { id: true, name: true, email: true } },
  members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
  phases: { orderBy: { order: "asc" as const } },
  milestones: { orderBy: { dueDate: "asc" as const } },
  statutoryItems: true,
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = await projectScopeWhere(req.user!);
    const { status, typology, clientId } = req.query;
    const projects = await prisma.project.findMany({
      where: {
        ...where,
        ...(status ? { status: String(status) } : {}),
        ...(typology ? { typology: String(typology) } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
      },
      include: {
        client: true,
        leadArchitect: { select: { id: true, name: true } },
        phases: { orderBy: { order: "asc" } },
        _count: { select: { tasks: true, rfis: true, milestones: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ projects });
  })
);

router.post(
  "/",
  requirePermission("MANAGE_PROJECT"),
  asyncHandler(async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    const officeId = req.user!.officeId;

    const [phaseTemplates, statutoryTemplates] = await Promise.all([
      prisma.phaseTemplate.findMany({ where: { officeId }, orderBy: { order: "asc" } }),
      prisma.statutoryChecklistTemplate.findMany({ where: { officeId } }),
    ]);

    const project = await prisma.project.create({
      data: {
        ...input,
        officeId,
        phases: {
          create: phaseTemplates.map((t) => ({ name: t.name, order: t.order })),
        },
        statutoryItems: {
          create: statutoryTemplates.map((t) => ({ name: t.name, jurisdiction: t.jurisdiction })),
        },
        ...(input.leadArchitectId
          ? { members: { create: { userId: input.leadArchitectId, roleOnProject: "Lead Architect" } } }
          : {}),
      },
      include: PROJECT_DETAIL_INCLUDE,
    });

    await recordAudit({ userId: req.user!.sub, action: "CREATE", entityType: "Project", entityId: project.id });
    res.status(201).json({ project });
  })
);

router.get(
  "/:projectId",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res, next) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: PROJECT_DETAIL_INCLUDE,
    });
    if (!project) return next(notFound("Project not found"));
    res.json({ project });
  })
);

router.patch(
  "/:projectId",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_PROJECT"),
  asyncHandler(async (req, res) => {
    const input = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: input,
      include: PROJECT_DETAIL_INCLUDE,
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "Project",
      entityId: project.id,
      changes: input,
    });
    res.json({ project });
  })
);

// ---- Members ----

router.post(
  "/:projectId/members",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_PROJECT"),
  asyncHandler(async (req, res) => {
    const { userId, roleOnProject } = req.body as { userId: string; roleOnProject?: string };
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.projectId, userId } },
      create: { projectId: req.params.projectId, userId, roleOnProject },
      update: { roleOnProject },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.status(201).json({ member });
  })
);

router.delete(
  "/:projectId/members/:userId",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_PROJECT"),
  asyncHandler(async (req, res) => {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
    });
    res.status(204).end();
  })
);

// ---- Phases ----

router.patch(
  "/:projectId/phases/:phaseId",
  requireProjectAccess("projectId"),
  requirePermission("MANAGE_PROJECT"),
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate } = req.body;
    const phase = await prisma.projectPhase.update({
      where: { id: req.params.phaseId },
      data: {
        ...(status ? { status } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      },
    });
    res.json({ phase });
  })
);

// ---- Milestones ----

router.get(
  "/:projectId/milestones",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { dueDate: "asc" },
    });
    res.json({ milestones });
  })
);

router.post(
  "/:projectId/milestones",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createMilestoneSchema.parse({ ...req.body, projectId: req.params.projectId });
    const milestone = await prisma.milestone.create({ data: input });
    res.status(201).json({ milestone });
  })
);

router.patch(
  "/:projectId/milestones/:milestoneId",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = updateMilestoneSchema.partial().parse(req.body);
    const milestone = await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: input,
    });
    res.json({ milestone });
  })
);

router.delete(
  "/:projectId/milestones/:milestoneId",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    await prisma.milestone.delete({ where: { id: req.params.milestoneId } });
    res.status(204).end();
  })
);

// ---- Statutory approvals ----

router.get(
  "/:projectId/statutory-items",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const items = await prisma.statutoryApprovalItem.findMany({
      where: { projectId: req.params.projectId },
    });
    res.json({ items });
  })
);

router.patch(
  "/:projectId/statutory-items/:itemId",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = updateStatutoryItemSchema.parse(req.body);
    const item = await prisma.statutoryApprovalItem.update({
      where: { id: req.params.itemId },
      data: input,
    });
    res.json({ item });
  })
);

export default router;
