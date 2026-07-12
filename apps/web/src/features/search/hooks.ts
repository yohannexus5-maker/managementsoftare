import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface SearchResultsDto {
  projects: { id: string; name: string; typology: string }[];
  consultants: { id: string; name: string; category: string }[];
  drawings: { id: string; drawingNumber: string; title: string; projectId: string }[];
  documents: { id: string; name: string; projectId: string }[];
  rfis: { id: string; question: string; projectId: string }[];
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => (await api.get<SearchResultsDto>("/search", { params: { q: query } })).data,
    enabled: query.trim().length > 1,
  });
}
