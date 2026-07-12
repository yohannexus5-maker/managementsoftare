import { z } from "zod";

export const createConsultantSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateConsultantInput = z.infer<typeof createConsultantSchema>;

export const updateConsultantSchema = createConsultantSchema.partial().extend({
  rating: z.coerce.number().min(0).max(5).optional(),
});
export type UpdateConsultantInput = z.infer<typeof updateConsultantSchema>;

export const createContractSchema = z.object({
  consultantId: z.string().min(1),
  projectId: z.string().min(1),
  scopeOfWork: z.string().min(1),
  fee: z.coerce.number().nonnegative(),
  retentionPct: z.coerce.number().min(0).max(100).optional(),
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "TERMINATED"]).optional(),
});
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

export const createPaymentMilestoneSchema = z.object({
  contractId: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  dueDate: z.coerce.date().optional(),
});
export type CreatePaymentMilestoneInput = z.infer<typeof createPaymentMilestoneSchema>;

export const updatePaymentMilestoneSchema = z.object({
  status: z.enum(["PENDING", "INVOICED", "PAID"]).optional(),
  amount: z.coerce.number().nonnegative().optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdatePaymentMilestoneInput = z.infer<typeof updatePaymentMilestoneSchema>;

export const createDeliverableSchema = z.object({
  projectId: z.string().min(1),
  ownerType: z.enum(["TEAM", "CONSULTANT"]),
  teamMemberId: z.string().optional(),
  consultantId: z.string().optional(),
  title: z.string().min(1),
  dueDate: z.coerce.date().optional(),
  phaseId: z.string().optional(),
});
export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;

export const updateDeliverableSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "OVERDUE"])
    .optional(),
  currentRevision: z.string().optional(),
});
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;
