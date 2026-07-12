import { Router } from "express";
import { createRfiSchema, respondRfiSchema, updateRfiSchema, Role } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere, canAccessProject } from "../../middleware/rbac";
import { notify } from "../../lib/notify";
import { forbidden, notFound } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status } = req.query;
    const scope = await projectScopeWhere(req.user!);

    // A consultant only sees RFI threads addressed to their own firm, never
    // the full project thread (which may include queries to other firms).
    let consultantFilter: { consultantId?: string } = {};
    if (req.user!.role === Role.CONSULTANT) {
      const self = await prisma.user.findUnique({ where: { id: req.user!.sub } });
      consultantFilter = { consultantId: self?.consultantId ?? "__none__" };
    }

    const rfis = await prisma.rFI.findMany({
      where: {
        project: scope,
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(status ? { status: String(status) } : {}),
        ...consultantFilter,
      },
      include: {
        raisedBy: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ rfis });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createRfiSchema.parse(req.body);
    const rfi = await prisma.rFI.create({
      data: { ...input, raisedById: req.user!.sub },
      include: { raisedBy: { select: { id: true, name: true } }, consultant: true },
    });

    if (rfi.consultantId) {
      const portalUsers = await prisma.user.findMany({ where: { consultantId: rfi.consultantId } });
      await Promise.all(
        portalUsers.map((u) =>
          notify({ userId: u.id, type: "RFI_RAISED", title: `New RFI: ${rfi.question.slice(0, 60)}` })
        )
      );
    }

    res.status(201).json({ rfi });
  })
);

router.patch(
  "/:id/respond",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.rFI.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("RFI not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) return next(forbidden("No access to this RFI"));

    const input = respondRfiSchema.parse(req.body);
    const rfi = await prisma.rFI.update({
      where: { id: req.params.id },
      data: { response: input.response, status: "RESPONDED", respondedAt: new Date() },
    });

    await notify({
      userId: rfi.raisedById,
      type: "RFI_RESPONDED",
      title: `RFI responded: ${rfi.question.slice(0, 60)}`,
    });

    res.json({ rfi });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.rFI.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("RFI not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) return next(forbidden("No access to this RFI"));

    const input = updateRfiSchema.parse(req.body);
    const rfi = await prisma.rFI.update({ where: { id: req.params.id }, data: input });
    res.json({ rfi });
  })
);

export default router;
