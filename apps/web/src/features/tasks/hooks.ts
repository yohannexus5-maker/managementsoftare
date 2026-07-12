import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateTaskInput, UpdateTaskInput } from "@apms/shared";

export interface TaskDto {
  id: string;
  projectId: string;
  phaseId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  requiredSkills: { id: string; name: string }[];
}

export function useTasks(filters?: { projectId?: string; assigneeId?: string }) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => (await api.get<{ tasks: TaskDto[] }>("/tasks", { params: filters })).data.tasks,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => (await api.post<{ task: TaskDto }>("/tasks", input)).data.task,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      (await api.patch<{ task: TaskDto }>(`/tasks/${id}`, input)).data.task,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
