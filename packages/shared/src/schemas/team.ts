import { z } from "zod";
import { TASK_STATUSES, TASK_PRIORITIES, LEAVE_TYPES } from "../constants";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  phaseId: z.string().optional(),
  assigneeId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  requiredSkillIds: z.array(z.string()).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(TASK_STATUSES).optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const createTimesheetSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  date: z.coerce.date(),
  hours: z.coerce.number().positive().max(24),
  billable: z.boolean().optional(),
  notes: z.string().optional(),
});
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;

export const updateTimesheetSchema = createTimesheetSchema.partial().extend({
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>;

export const createLeaveRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(LEAVE_TYPES),
  reason: z.string().optional(),
});
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const decideLeaveRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  decisionNotes: z.string().optional(),
});
export type DecideLeaveRequestInput = z.infer<typeof decideLeaveRequestSchema>;
