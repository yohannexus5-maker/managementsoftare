import { z } from "zod";
import { DRAWING_STATUSES, RFI_STATUSES, DOCUMENT_CATEGORIES } from "../constants";

export const createDrawingSchema = z.object({
  projectId: z.string().min(1),
  drawingNumber: z.string().min(1),
  title: z.string().min(1),
  revision: z.string().min(1),
  issuedTo: z.string().optional(),
});
export type CreateDrawingInput = z.infer<typeof createDrawingSchema>;

export const updateDrawingSchema = z.object({
  title: z.string().min(1).optional(),
  revision: z.string().min(1).optional(),
  status: z.enum(DRAWING_STATUSES).optional(),
  issuedTo: z.string().optional(),
  issueDate: z.coerce.date().optional(),
});
export type UpdateDrawingInput = z.infer<typeof updateDrawingSchema>;

export const createRfiSchema = z.object({
  projectId: z.string().min(1),
  raisedTo: z.string().min(1),
  consultantId: z.string().optional(),
  question: z.string().min(1),
  dueDate: z.coerce.date().optional(),
});
export type CreateRfiInput = z.infer<typeof createRfiSchema>;

export const respondRfiSchema = z.object({
  response: z.string().min(1),
});
export type RespondRfiInput = z.infer<typeof respondRfiSchema>;

export const updateRfiSchema = z.object({
  status: z.enum(RFI_STATUSES).optional(),
});
export type UpdateRfiInput = z.infer<typeof updateRfiSchema>;

export const createSiteVisitSchema = z.object({
  projectId: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().min(1),
  actionItems: z
    .array(
      z.object({
        description: z.string().min(1),
        assigneeId: z.string().optional(),
        dueDate: z.coerce.date().optional(),
      })
    )
    .optional(),
});
export type CreateSiteVisitInput = z.infer<typeof createSiteVisitSchema>;

export const createDocumentMetaSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(DOCUMENT_CATEGORIES),
  linkedToType: z.string().optional(),
  linkedToId: z.string().optional(),
});
export type CreateDocumentMetaInput = z.infer<typeof createDocumentMetaSchema>;
