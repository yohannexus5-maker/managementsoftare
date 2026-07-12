import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateProjectInput, CreateMilestoneInput, UpdateMilestoneInput } from "@apms/shared";
import type { MilestoneDto, ProjectDetailDto, ProjectListItemDto, StatutoryItemDto } from "./types";

export function useProjects(filters?: { status?: string; typology?: string }) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () =>
      (await api.get<{ projects: ProjectListItemDto[] }>("/projects", { params: filters })).data.projects,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => (await api.get<{ project: ProjectDetailDto }>(`/projects/${id}`)).data.project,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => (await api.post("/projects", input)).data.project,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => (await api.patch(`/projects/${id}`, input)).data.project,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", id] });
    },
  });
}

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreateMilestoneInput, "projectId">) =>
      (await api.post<{ milestone: MilestoneDto }>(`/projects/${projectId}/milestones`, input)).data.milestone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMilestoneInput & { id: string }) =>
      (await api.patch<{ milestone: MilestoneDto }>(`/projects/${projectId}/milestones/${id}`, input)).data
        .milestone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${projectId}/milestones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUpdateStatutoryItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: string; notes?: string }) =>
      (await api.patch<{ item: StatutoryItemDto }>(`/projects/${projectId}/statutory-items/${id}`, input)).data
        .item,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUpdatePhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: string }) =>
      (await api.patch(`/projects/${projectId}/phases/${id}`, input)).data.phase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}
