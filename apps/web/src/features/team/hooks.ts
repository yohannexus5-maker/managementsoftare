import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateUserInput } from "@apms/shared";

export interface TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role: string;
  seniority: string | null;
  skills: { id: string; name: string }[];
}

export interface WorkloadDto {
  id: string;
  name: string;
  role: string;
  activeTaskCount: number;
  activeProjectCount: number;
  hoursLastWeek: number;
  utilizationPct: number;
  flag: "OVER_ALLOCATED" | "UNDER_ALLOCATED" | "NORMAL";
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team", "members"],
    queryFn: async () => (await api.get<{ members: TeamMemberDto[] }>("/team/members")).data.members,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ["team", "skills"],
    queryFn: async () => (await api.get<{ skills: { id: string; name: string }[] }>("/team/skills")).data.skills,
  });
}

export function useWorkload() {
  return useQuery({
    queryKey: ["team", "workload"],
    queryFn: async () => (await api.get<{ workload: WorkloadDto[] }>("/team/workload")).data.workload,
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => (await api.post("/team/members", input)).data.member,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}
