import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

const router = Router();
router.use(requireAuth);
router.use(requirePermission("VIEW_AUDIT_LOG"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType: String(entityType) } : {}),
        ...(entityId ? { entityId: String(entityId) } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ logs });
  })
);

export default router;
