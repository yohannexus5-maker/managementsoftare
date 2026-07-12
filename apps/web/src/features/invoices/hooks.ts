import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreateInvoiceInput, UpdateInvoiceInput } from "@apms/shared";

export interface InvoiceDto {
  id: string;
  projectId: string;
  type: string;
  consultantContractId: string | null;
  amount: number;
  amountPaid: number;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  description: string | null;
  project: { id: string; name: string };
  consultantContract: { id: string; consultant: { id: string; name: string } } | null;
  createdBy: { id: string; name: string };
}

export function useInvoices(filters?: { projectId?: string; type?: string; status?: string }) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => (await api.get<{ invoices: InvoiceDto[] }>("/invoices", { params: filters })).data.invoices,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => (await api.post("/invoices", input)).data.invoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInvoiceInput & { id: string }) =>
      (await api.patch(`/invoices/${id}`, input)).data.invoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["financials"] });
    },
  });
}
