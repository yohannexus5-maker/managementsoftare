import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateClientInput } from "@apms/shared";

export interface ClientDto {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await api.get<{ clients: ClientDto[] }>("/clients")).data.clients,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClientInput) => (await api.post("/clients", input)).data.client as ClientDto,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
