import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface WithProject {
  id: string;
  project: { id: string; name: string };
}

export interface MilestoneItem extends WithProject {
  title: string;
  dueDate: string;
  status: string;
}

export interface TaskItem extends WithProject {
  title: string;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
}

export interface RfiItem extends WithProject {
  question: string;
  dueDate: string | null;
}

export interface DeliverableItem extends WithProject {
  title: string;
  dueDate: string | null;
  status: string;
  consultant: { id: string; name: string } | null;
}

export interface MeetingItem extends WithProject {
  title: string;
  date: string;
}

export interface ApprovalItem {
  id: string;
  entityType: string;
  entityId: string;
  requestedBy: { id: string; name: string };
  createdAt: string;
}

export interface DashboardSummaryDto {
  activeProjectsCount: number;
  upcomingMilestones: MilestoneItem[];
  overdueMilestones: MilestoneItem[];
  overdueTasks: TaskItem[];
  overdueRfis: RfiItem[];
  pendingDeliverables: DeliverableItem[];
  todaysMeetings: MeetingItem[];
  myPendingApprovals: ApprovalItem[];
  kpis?: {
    revenueByTypology: Record<string, number>;
    avgProjectDurationDays: number;
    onTimeDeliveryRate: number;
    teamUtilizationRate: number;
    totalRevenue: number;
  };
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => (await api.get<DashboardSummaryDto>("/dashboard/summary")).data,
  });
}
