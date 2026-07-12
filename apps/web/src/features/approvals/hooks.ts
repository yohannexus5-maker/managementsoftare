import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useRequestApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { entityType: string; entityId: string; projectId?: string }) =>
      (await api.post("/approvals", input)).data.request,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "APPROVED" | "REJECTED"; notes?: string }) =>
      (await api.post(`/approvals/${id}/decide`, { decision, notes })).data.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useApprovals(filters?: { mine?: boolean; status?: string }) {
  return useQuery({
    queryKey: ["approvals", filters],
    queryFn: async () =>
      (
        await api.get("/approvals", { params: { ...filters, mine: filters?.mine ? "true" : undefined } })
      ).data.approvals,
  });
}
