import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateConsultantInput, UpdateConsultantInput } from "@apms/shared";
import type { ConsultantDetailDto, ConsultantListItemDto } from "./types";

export function useConsultants() {
  return useQuery({
    queryKey: ["consultants"],
    queryFn: async () =>
      (await api.get<{ consultants: ConsultantListItemDto[] }>("/consultants")).data.consultants,
  });
}

export function useConsultant(id: string | undefined) {
  return useQuery({
    queryKey: ["consultants", id],
    queryFn: async () => (await api.get<{ consultant: ConsultantDetailDto }>(`/consultants/${id}`)).data.consultant,
    enabled: !!id,
  });
}

export function useCreateConsultant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateConsultantInput) => (await api.post("/consultants", input)).data.consultant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultants"] }),
  });
}

export function useUpdateConsultant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateConsultantInput) => (await api.patch(`/consultants/${id}`, input)).data.consultant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultants"] });
      qc.invalidateQueries({ queryKey: ["consultants", id] });
    },
  });
}
