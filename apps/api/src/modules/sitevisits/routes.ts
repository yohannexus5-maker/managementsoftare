import { Router } from "express";
import { createSiteVisitSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere } from "../../middleware/rbac";
import { upload } from "../../middleware/upload";
import { absoluteToRelative } from "../../lib/storage";

const router = Router();
router.use(requireAuth);

const SITE_VISIT_INCLUDE = {
  visitedBy: { select: { id: true, name: true } },
  actionItems: true,
  photos: true,
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const siteVisits = await prisma.siteVisitLog.findMany({
      where: { project: scope, ...(projectId ? { projectId: String(projectId) } : {}) },
      include: SITE_VISIT_INCLUDE,
      orderBy: { date: "desc" },
    });
    res.json({ siteVisits });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createSiteVisitSchema.parse(req.body);
    const siteVisit = await prisma.siteVisitLog.create({
      data: {
        projectId: input.projectId,
        visitedById: req.user!.sub,
        date: input.date,
        notes: input.notes,
        actionItems: input.actionItems
          ? {
              create: input.actionItems.map((ai) => ({
                description: ai.description,
                assigneeId: ai.assigneeId,
                dueDate: ai.dueDate,
              })),
            }
          : undefined,
      },
      include: SITE_VISIT_INCLUDE,
    });
    res.status(201).json({ siteVisit });
  })
);

router.post(
  "/:id/photos",
  asyncHandler(async (req, res, next) => {
    const siteVisit = await prisma.siteVisitLog.findUnique({ where: { id: req.params.id } });
    if (!siteVisit) return next();
    req.body.projectId = siteVisit.projectId;
    req.params.projectId = siteVisit.projectId;
    next();
  }),
  upload.single("file"),
  asyncHandler(async (req, res, next) => {
    const siteVisit = await prisma.siteVisitLog.findUnique({ where: { id: req.params.id } });
    if (!siteVisit || !req.file) return next();

    const document = await prisma.document.create({
      data: {
        projectId: siteVisit.projectId,
        name: req.file.originalname,
        category: "PHOTO",
        filePath: absoluteToRelative(req.file.path),
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user!.sub,
        siteVisitId: siteVisit.id,
      },
    });
    res.status(201).json({ document });
  })
);

router.patch(
  "/action-items/:id",
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: "OPEN" | "DONE" };
    const item = await prisma.siteVisitActionItem.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ item });
  })
);

export default router;
