import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { projectScopeWhere } from "../../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ projects: [], consultants: [], drawings: [], documents: [], rfis: [] });

    const scope = await projectScopeWhere(req.user!);

    const [projects, consultants, drawings, documents, rfis] = await Promise.all([
      prisma.project.findMany({
        where: { ...scope, name: { contains: q } },
        select: { id: true, name: true, typology: true },
        take: 10,
      }),
      prisma.consultant.findMany({
        where: { officeId: req.user!.officeId, name: { contains: q } },
        select: { id: true, name: true, category: true },
        take: 10,
      }),
      prisma.drawingRegisterEntry.findMany({
        where: { project: scope, OR: [{ drawingNumber: { contains: q } }, { title: { contains: q } }] },
        select: { id: true, drawingNumber: true, title: true, projectId: true },
        take: 10,
      }),
      prisma.document.findMany({
        where: { project: scope, name: { contains: q } },
        select: { id: true, name: true, projectId: true },
        take: 10,
      }),
      prisma.rFI.findMany({
        where: { project: scope, question: { contains: q } },
        select: { id: true, question: true, projectId: true },
        take: 10,
      }),
    ]);

    res.json({ projects, consultants, drawings, documents, rfis });
  })
);

export default router;
