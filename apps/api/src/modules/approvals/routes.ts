import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { badRequest, forbidden, notFound } from "../../middleware/errors";
import { notify } from "../../lib/notify";

const router = Router();
router.use(requireAuth);

const DEFAULT_CHAINS: Record<string, string> = {
  DRAWING: "PROJECT_ARCHITECT,PRINCIPAL",
  INVOICE: "ADMIN_MANAGER,PRINCIPAL",
  CONTRACT: "PRINCIPAL",
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { mine, status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = String(status);

    let requests = await prisma.approvalRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true } },
        decisions: { include: { approver: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (mine === "true") {
      requests = requests.filter((r) => {
        const roles = r.rolesCsv.split(",");
        return r.status === "PENDING" && roles[r.currentStepIndex] === req.user!.role;
      });
    }

    res.json({ approvals: requests });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    const { entityType, entityId, projectId } = req.body as {
      entityType: string;
      entityId: string;
      projectId?: string;
    };
    if (!entityType || !entityId) return next(badRequest("entityType and entityId are required"));

    const config = await prisma.approvalChainConfig.findUnique({
      where: { officeId_entityType: { officeId: req.user!.officeId, entityType } },
    });
    const rolesCsv = config?.rolesCsv ?? DEFAULT_CHAINS[entityType] ?? "PRINCIPAL";

    const request = await prisma.approvalRequest.create({
      data: { entityType, entityId, projectId, requestedById: req.user!.sub, rolesCsv },
    });

    const firstRole = rolesCsv.split(",")[0];
    const approvers = await prisma.user.findMany({
      where: { officeId: req.user!.officeId, role: firstRole },
    });
    await Promise.all(
      approvers.map((a) =>
        notify({
          userId: a.id,
          type: "APPROVAL_REQUESTED",
          title: `${entityType} approval requested`,
          link: "/",
        })
      )
    );

    res.status(201).json({ request });
  })
);

router.post(
  "/:id/decide",
  asyncHandler(async (req, res, next) => {
    const { decision, notes } = req.body as { decision: "APPROVED" | "REJECTED"; notes?: string };
    const request = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return next(notFound("Approval request not found"));
    if (request.status !== "PENDING") return next(forbidden("Approval request already decided"));

    const roles = request.rolesCsv.split(",");
    if (roles[request.currentStepIndex] !== req.user!.role) {
      return next(forbidden("Not the current approver for this request"));
    }

    await prisma.approvalDecision.create({
      data: {
        approvalRequestId: request.id,
        stepIndex: request.currentStepIndex,
        approverId: req.user!.sub,
        role: req.user!.role,
        decision,
        notes,
      },
    });

    const isLastStep = request.currentStepIndex >= roles.length - 1;
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data:
        decision === "REJECTED"
          ? { status: "REJECTED", decidedAt: new Date() }
          : isLastStep
            ? { status: "APPROVED", decidedAt: new Date() }
            : { currentStepIndex: request.currentStepIndex + 1 },
    });

    await notify({
      userId: request.requestedById,
      type: "APPROVAL_DECIDED",
      title: `${request.entityType} approval ${updated.status === "PENDING" ? "advanced" : updated.status.toLowerCase()}`,
    });

    if (updated.status === "PENDING") {
      const nextRole = roles[updated.currentStepIndex];
      const nextApprovers = await prisma.user.findMany({
        where: { officeId: req.user!.officeId, role: nextRole },
      });
      await Promise.all(
        nextApprovers.map((a) =>
          notify({ userId: a.id, type: "APPROVAL_REQUESTED", title: `${request.entityType} approval requested` })
        )
      );
    }

    res.json({ request: updated });
  })
);

export default router;
