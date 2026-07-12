import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateRfiInput } from "@apms/shared";

export interface RfiDto {
  id: string;
  projectId: string;
  raisedTo: string;
  question: string;
  response: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  raisedBy: { id: string; name: string };
  consultant: { id: string; name: string } | null;
}

export function useRfis(projectId: string) {
  return useQuery({
    queryKey: ["rfis", projectId],
    queryFn: async () => (await api.get<{ rfis: RfiDto[] }>("/rfis", { params: { projectId } })).data.rfis,
    enabled: !!projectId,
  });
}

export function useCreateRfi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRfiInput) => (await api.post("/rfis", input)).data.rfi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfis"] }),
  });
}

export function useRespondRfi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) =>
      (await api.patch(`/rfis/${id}/respond`, { response })).data.rfi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfis"] }),
  });
}

export function useCloseRfi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/rfis/${id}`, { status: "CLOSED" })).data.rfi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfis"] }),
  });
}
