import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateDrawingInput, UpdateDrawingInput } from "@apms/shared";

export interface DrawingDto {
  id: string;
  projectId: string;
  drawingNumber: string;
  title: string;
  revision: string;
  status: string;
  issueDate: string | null;
  issuedTo: string | null;
  consultant: { id: string; name: string } | null;
}

export function useDrawings(projectId: string) {
  return useQuery({
    queryKey: ["drawings", projectId],
    queryFn: async () => (await api.get<{ drawings: DrawingDto[] }>("/drawings", { params: { projectId } })).data.drawings,
    enabled: !!projectId,
  });
}

export function useCreateDrawing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDrawingInput) => (await api.post("/drawings", input)).data.drawing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drawings"] }),
  });
}

export function useUpdateDrawing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDrawingInput & { id: string }) =>
      (await api.patch(`/drawings/${id}`, input)).data.drawing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drawings"] }),
  });
}
