import { z } from "zod";
import { PROJECT_STATUSES } from "../constants";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().min(1),
  typology: z.string().min(1),
  scope: z.string().optional(),
  fee: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  leadArchitectId: z.string().optional(),
  siteAddress: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createClientSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  phaseId: z.string().optional(),
  title: z.string().min(1),
  dueDate: z.coerce.date(),
  reminderDaysBefore: z.coerce.number().int().nonnegative().optional(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  status: z.enum(["PENDING", "DONE", "OVERDUE"]).optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const createStatutoryItemSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  jurisdiction: z.string().optional(),
});
export type CreateStatutoryItemInput = z.infer<typeof createStatutoryItemSchema>;

export const updateStatutoryItemSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  submittedDate: z.coerce.date().optional(),
  approvedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});
export type UpdateStatutoryItemInput = z.infer<typeof updateStatutoryItemSchema>;
