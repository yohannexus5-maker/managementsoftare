import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateTimesheetInput } from "@apms/shared";

export interface TimesheetDto {
  id: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  date: string;
  hours: number;
  billable: boolean;
  notes: string | null;
  approvalStatus: string;
  user: { id: string; name: string };
  project: { id: string; name: string };
  task: { id: string; title: string } | null;
}

export function useTimesheets(filters?: { mine?: boolean; approvalStatus?: string; projectId?: string }) {
  return useQuery({
    queryKey: ["timesheets", filters],
    queryFn: async () =>
      (
        await api.get<{ timesheets: TimesheetDto[] }>("/timesheets", {
          params: { ...filters, mine: filters?.mine ? "true" : undefined },
        })
      ).data.timesheets,
  });
}

export function useLogTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTimesheetInput) => (await api.post("/timesheets", input)).data.timesheet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}

export function useDecideTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approvalStatus }: { id: string; approvalStatus: "APPROVED" | "REJECTED" }) =>
      (await api.patch(`/timesheets/${id}`, { approvalStatus })).data.timesheet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}
