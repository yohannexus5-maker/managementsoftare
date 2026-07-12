import { z } from "zod";
import { INVOICE_TYPES, INVOICE_STATUSES } from "../constants";

export const createInvoiceSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(INVOICE_TYPES),
  consultantContractId: z.string().optional(),
  amount: z.coerce.number().positive(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  description: z.string().optional(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  status: z.enum(INVOICE_STATUSES).optional(),
  paidDate: z.coerce.date().optional(),
  amountPaid: z.coerce.number().nonnegative().optional(),
});
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
