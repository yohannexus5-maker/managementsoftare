import { Router } from "express";
import { createTaskSchema, updateTaskSchema } from "@apms/shared";
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
    const { projectId, assigneeId, status } = req.query;
    const scope = await projectScopeWhere(req.user!);
    const tasks = await prisma.task.findMany({
      where: {
        project: scope,
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(assigneeId ? { assigneeId: String(assigneeId) } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        requiredSkills: true,
      },
      orderBy: { dueDate: "asc" },
    });
    res.json({ tasks });
  })
);

router.get(
  "/:id/suggested-assignees",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { requiredSkills: true },
    });
    if (!task || task.requiredSkills.length === 0) return res.json({ suggestions: [] });

    const members = await prisma.user.findMany({
      where: {
        officeId: req.user!.officeId,
        active: true,
        skills: { some: { id: { in: task.requiredSkills.map((s) => s.id) } } },
      },
      select: { id: true, name: true, role: true, skills: true },
    });
    const suggestions = members
      .map((m) => ({
        ...m,
        matchCount: m.skills.filter((s) => task.requiredSkills.some((rs) => rs.id === s.id)).length,
      }))
      .sort((a, b) => b.matchCount - a.matchCount);
    res.json({ suggestions });
  })
);

router.post(
  "/",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res) => {
    const input = createTaskSchema.parse(req.body);
    const { requiredSkillIds, ...rest } = input;
    const task = await prisma.task.create({
      data: {
        ...rest,
        requiredSkills: requiredSkillIds ? { connect: requiredSkillIds.map((id) => ({ id })) } : undefined,
      },
      include: { assignee: true, requiredSkills: true },
    });

    if (task.assigneeId) {
      await notify({
        userId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: `New task assigned: ${task.title}`,
        link: `/tasks`,
      });
    }

    res.status(201).json({ task });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Task not found"));
    if (!(await canAccessProject(req.user!, existing.projectId))) return next(forbidden("No access to this task"));

    const input = updateTaskSchema.parse(req.body);
    const { requiredSkillIds, ...rest } = input;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(requiredSkillIds ? { requiredSkills: { set: requiredSkillIds.map((id) => ({ id })) } } : {}),
      },
      include: { assignee: true, requiredSkills: true },
    });

    if (input.assigneeId) {
      await notify({
        userId: input.assigneeId,
        type: "TASK_ASSIGNED",
        title: `You were assigned: ${task.title}`,
        link: `/tasks`,
      });
    }

    res.json({ task });
  })
);

export default router;
