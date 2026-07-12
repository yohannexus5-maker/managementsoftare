import { Router } from "express";
import { createDrawingSchema, updateDrawingSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere, canAccessProject } from "../../middleware/rbac";
import { recordAudit } from "../../lib/audit";
import { forbidden, notFound } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const drawings = await prisma.drawingRegisterEntry.findMany({
      where: {
        project: scope,
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: { consultant: { select: { id: true, name: true } } },
      orderBy: { drawingNumber: "asc" },
    });
    res.json({ drawings });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createDrawingSchema.parse(req.body);
    const drawing = await prisma.drawingRegisterEntry.create({
      data: { ...input, consultantId: req.body.consultantId || undefined },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "CREATE",
      entityType: "DrawingRegisterEntry",
      entityId: drawing.id,
    });
    res.status(201).json({ drawing });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.drawingRegisterEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Drawing not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) return next(forbidden("No access to this drawing"));

    const input = updateDrawingSchema.parse(req.body);
    const drawing = await prisma.drawingRegisterEntry.update({
      where: { id: req.params.id },
      data: {
        ...input,
        ...(input.status === "ISSUED" && !req.body.issueDate ? { issueDate: new Date() } : {}),
      },
    });
    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "DrawingRegisterEntry",
      entityId: drawing.id,
      changes: input,
    });
    res.json({ drawing });
  })
);

export default router;
