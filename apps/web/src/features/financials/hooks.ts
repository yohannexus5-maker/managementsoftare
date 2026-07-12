import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface ProjectFinancialsDto {
  projectId: string;
  projectName: string;
  fee: number;
  feeInvoiced: number;
  feeCollected: number;
  consultantBudget: number;
  consultantPaid: number;
  totalHours: number;
  hoursCost: number;
  profitability: number;
}

export interface FinancialsOverviewDto {
  projects: ProjectFinancialsDto[];
  totals: {
    fee: number;
    feeInvoiced: number;
    feeCollected: number;
    consultantBudget: number;
    consultantPaid: number;
    profitability: number;
  };
  assumedHourlyCostRate: number;
}

export function useFinancialsOverview() {
  return useQuery({
    queryKey: ["financials", "overview"],
    queryFn: async () => (await api.get<FinancialsOverviewDto>("/financials/overview")).data,
  });
}
