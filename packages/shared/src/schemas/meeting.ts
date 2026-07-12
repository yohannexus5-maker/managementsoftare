import { z } from "zod";

export const createMeetingSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  date: z.coerce.date(),
  location: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  participantNames: z.array(z.string()).optional(),
});
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = z.object({
  minutes: z.string().optional(),
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
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
