import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateLeaveRequestInput } from "@apms/shared";

export interface LeaveRequestDto {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: string;
  decisionNotes: string | null;
  user: { id: string; name: string };
}

export function useLeaveRequests(filters?: { mine?: boolean; status?: string }) {
  return useQuery({
    queryKey: ["leave", filters],
    queryFn: async () =>
      (
        await api.get<{ leaveRequests: LeaveRequestDto[] }>("/leave", {
          params: { ...filters, mine: filters?.mine ? "true" : undefined },
        })
      ).data.leaveRequests,
  });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveRequestInput) => (await api.post("/leave", input)).data.leaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
  });
}

export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      (await api.patch(`/leave/${id}/decide`, { status })).data.leaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
  });
}
