import { Router } from "express";
import { createMeetingSchema, updateMeetingSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess, projectScopeWhere, canAccessProject } from "../../middleware/rbac";
import { notFound, forbidden } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

const MEETING_INCLUDE = {
  participants: { include: { user: { select: { id: true, name: true } } } },
  actionItems: true,
  createdBy: { select: { id: true, name: true } },
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const meetings = await prisma.meeting.findMany({
      where: {
        ...(projectId ? { projectId: String(projectId) } : {}),
        project: scope,
      },
      include: MEETING_INCLUDE,
      orderBy: { date: "desc" },
    });
    res.json({ meetings });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createMeetingSchema.parse(req.body);
    const meeting = await prisma.meeting.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        date: input.date,
        location: input.location,
        createdById: req.user!.sub,
        participants: {
          create: [
            ...(input.participantIds ?? []).map((userId) => ({ userId })),
            ...(input.participantNames ?? []).map((name) => ({ name })),
          ],
        },
      },
      include: MEETING_INCLUDE,
    });
    res.status(201).json({ meeting });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const meeting = await prisma.meeting.findFirst({
      where: { id: req.params.id, project: { officeId: req.user!.officeId } },
      include: MEETING_INCLUDE,
    });
    if (!meeting) return next(notFound("Meeting not found"));
    res.json({ meeting });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Meeting not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) return next(forbidden("No access to this meeting"));

    const input = updateMeetingSchema.parse(req.body);
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        ...(input.minutes !== undefined ? { minutes: input.minutes } : {}),
        ...(input.actionItems
          ? {
              actionItems: {
                create: input.actionItems.map((ai) => ({
                  description: ai.description,
                  assigneeId: ai.assigneeId,
                  dueDate: ai.dueDate,
                })),
              },
            }
          : {}),
      },
      include: MEETING_INCLUDE,
    });
    res.json({ meeting });
  })
);

router.patch(
  "/action-items/:id",
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: "OPEN" | "DONE" };
    const item = await prisma.meetingActionItem.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ item });
  })
);

export default router;
