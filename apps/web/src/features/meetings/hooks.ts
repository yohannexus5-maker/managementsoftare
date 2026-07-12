import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateMeetingInput } from "@apms/shared";

export interface MeetingActionItemDto {
  id: string;
  description: string;
  status: string;
  dueDate: string | null;
  assigneeId: string | null;
}

export interface MeetingDto {
  id: string;
  projectId: string;
  title: string;
  date: string;
  location: string | null;
  minutes: string | null;
  createdBy: { id: string; name: string };
  participants: { id: string; name: string | null; user: { id: string; name: string } | null }[];
  actionItems: MeetingActionItemDto[];
}

export function useMeetings(projectId: string) {
  return useQuery({
    queryKey: ["meetings", projectId],
    queryFn: async () => (await api.get<{ meetings: MeetingDto[] }>("/meetings", { params: { projectId } })).data.meetings,
    enabled: !!projectId,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMeetingInput) => (await api.post("/meetings", input)).data.meeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeetingMinutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      minutes,
      actionItems,
    }: {
      id: string;
      minutes?: string;
      actionItems?: { description: string; assigneeId?: string; dueDate?: Date }[];
    }) => (await api.patch(`/meetings/${id}`, { minutes, actionItems })).data.meeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}
