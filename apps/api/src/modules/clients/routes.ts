import { Router } from "express";
import { createClientSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { recordAudit } from "../../lib/audit";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({
      where: { officeId: req.user!.officeId },
      orderBy: { name: "asc" },
    });
    res.json({ clients });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createClientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: { ...input, officeId: req.user!.officeId },
    });
    await recordAudit({ userId: req.user!.sub, action: "CREATE", entityType: "Client", entityId: client.id });
    res.status(201).json({ client });
  })
);

export default router;
