import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateSiteVisitInput } from "@apms/shared";

export interface SiteVisitDto {
  id: string;
  projectId: string;
  date: string;
  notes: string;
  visitedBy: { id: string; name: string };
  actionItems: { id: string; description: string; status: string; dueDate: string | null }[];
  photos: { id: string; name: string }[];
}

export function useSiteVisits(projectId: string) {
  return useQuery({
    queryKey: ["sitevisits", projectId],
    queryFn: async () =>
      (await api.get<{ siteVisits: SiteVisitDto[] }>("/sitevisits", { params: { projectId } })).data.siteVisits,
    enabled: !!projectId,
  });
}

export function useCreateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSiteVisitInput) => (await api.post("/sitevisits", input)).data.siteVisit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sitevisits"] }),
  });
}
