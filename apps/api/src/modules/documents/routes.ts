import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere, canAccessProject } from "../../middleware/rbac";
import { upload } from "../../middleware/upload";
import { absoluteToRelative, relativeToAbsolute } from "../../lib/storage";
import { notFound, forbidden } from "../../middleware/errors";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, category } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const documents = await prisma.document.findMany({
      where: {
        project: scope,
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(category ? { category: String(category) } : {}),
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        versions: { orderBy: { version: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ documents });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  upload.single("file"),
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next(forbidden("No file uploaded"));
    const { projectId, name, category, linkedToType, linkedToId } = req.body;

    const document = await prisma.document.create({
      data: {
        projectId,
        name: name || req.file.originalname,
        category: category || "OTHER",
        filePath: absoluteToRelative(req.file.path),
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user!.sub,
        linkedToType: linkedToType || undefined,
        linkedToId: linkedToId || undefined,
      },
    });

    await recordAudit({ userId: req.user!.sub, action: "CREATE", entityType: "Document", entityId: document.id });
    res.status(201).json({ document });
  })
);

router.post(
  "/:id/versions",
  upload.single("file"),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Document not found"));
    if (!req.file) return next(forbidden("No file uploaded"));

    const nextVersion = existing.version + 1;
    const [, document] = await prisma.$transaction([
      prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          version: nextVersion,
          filePath: absoluteToRelative(req.file.path),
          uploadedById: req.user!.sub,
        },
      }),
      prisma.document.update({
        where: { id: existing.id },
        data: {
          version: nextVersion,
          filePath: absoluteToRelative(req.file.path),
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedById: req.user!.sub,
        },
      }),
    ]);

    await recordAudit({
      userId: req.user!.sub,
      action: "UPDATE",
      entityType: "Document",
      entityId: document.id,
      changes: { newVersion: nextVersion },
    });
    res.status(201).json({ document });
  })
);

router.get(
  "/:id/file",
  asyncHandler(async (req, res, next) => {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return next(notFound("Document not found"));

    const allowed = await canAccessProject(req.user!, document.projectId);
    if (!allowed) return next(forbidden("No access to this document"));

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${document.name}"`);
    res.sendFile(relativeToAbsolute(document.filePath));
  })
);

export default router;
