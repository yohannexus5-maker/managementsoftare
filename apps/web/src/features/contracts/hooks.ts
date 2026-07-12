import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateContractInput, CreatePaymentMilestoneInput } from "@apms/shared";
import type { ContractDto } from "../consultants/types";

export function useContracts(filters: { projectId?: string; consultantId?: string }) {
  return useQuery({
    queryKey: ["contracts", filters],
    queryFn: async () => (await api.get<{ contracts: ContractDto[] }>("/contracts", { params: filters })).data.contracts,
    enabled: !!(filters.projectId || filters.consultantId),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContractInput) => (await api.post("/contracts", input)).data.contract,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: string }) =>
      (await api.patch(`/contracts/${id}`, input)).data.contract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useAddPaymentMilestone(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreatePaymentMilestoneInput, "contractId">) =>
      (await api.post(`/contracts/${contractId}/payment-milestones`, input)).data.milestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}

export function useUpdatePaymentMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: string }) =>
      (await api.patch(`/contracts/payment-milestones/${id}`, input)).data.milestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}
