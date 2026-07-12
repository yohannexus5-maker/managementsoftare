import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateDeliverableInput, UpdateDeliverableInput } from "@apms/shared";
import type { DeliverableDto } from "../consultants/types";

export function useDeliverables(filters: { projectId?: string; consultantId?: string }) {
  return useQuery({
    queryKey: ["deliverables", filters],
    queryFn: async () =>
      (await api.get<{ deliverables: DeliverableDto[] }>("/deliverables", { params: filters })).data.deliverables,
    enabled: !!(filters.projectId || filters.consultantId),
  });
}

export function useCreateDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDeliverableInput) => (await api.post("/deliverables", input)).data.deliverable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables"] }),
  });
}

export function useUpdateDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDeliverableInput & { id: string }) =>
      (await api.patch(`/deliverables/${id}`, input)).data.deliverable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables"] }),
  });
}
