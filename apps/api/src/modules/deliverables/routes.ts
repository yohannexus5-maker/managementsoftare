import { Router } from "express";
import { createDeliverableSchema, updateDeliverableSchema, Role } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere, canAccessProject } from "../../middleware/rbac";
import { recordAudit } from "../../lib/audit";
import { notify } from "../../lib/notify";
import { forbidden, notFound } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, consultantId } = req.query;
    const scope = await projectScopeWhere(req.user!);

    let effectiveConsultantId = consultantId ? String(consultantId) : undefined;
    let ownerTypeFilter: { ownerType?: string } = {};
    if (req.user!.role === Role.CONSULTANT) {
      const self = await prisma.user.findUnique({ where: { id: req.user!.sub } });
      effectiveConsultantId = self?.consultantId ?? "__none__";
      ownerTypeFilter = { ownerType: "CONSULTANT" };
    }

    const deliverables = await prisma.deliverable.findMany({
      where: {
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(effectiveConsultantId ? { consultantId: effectiveConsultantId } : {}),
        ...ownerTypeFilter,
        project: scope,
      },
      include: { consultant: true, phase: true },
      orderBy: { dueDate: "asc" },
    });
    res.json({ deliverables });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createDeliverableSchema.parse(req.body);
    const deliverable = await prisma.deliverable.create({ data: input });

    if (input.ownerType === "TEAM" && input.teamMemberId) {
      await notify({
        userId: input.teamMemberId,
        type: "TASK_ASSIGNED",
        title: `New deliverable assigned: ${input.title}`,
        link: `/projects/${input.projectId}?tab=deliverables`,
      });
    }

    await recordAudit({
      userId: req.user!.sub,
      action: "CREATE",
      entityType: "Deliverable",
      entityId: deliverable.id,
    });
    res.status(201).json({ deliverable });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.deliverable.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Deliverable not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) {
      return next(forbidden("No access to this deliverable"));
    }
    if (req.user!.role === Role.CONSULTANT) {
      const self = await prisma.user.findUnique({ where: { id: req.user!.sub } });
      if (existing.consultantId !== self?.consultantId) return next(forbidden("Not your deliverable"));
    }

    const input = updateDeliverableSchema.parse(req.body);
    const deliverable = await prisma.deliverable.update({
      where: { id: req.params.id },
      data: input,
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "Deliverable",
      entityId: deliverable.id,
      changes: input,
    });
    res.json({ deliverable });
  })
);

export default router;
