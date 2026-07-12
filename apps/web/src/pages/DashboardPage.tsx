import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { PageHeader, Card, Button, StatusPill, Spinner, EmptyState } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { useDashboardSummary } from "../features/dashboard/hooks";
import { useDecideApproval } from "../features/approvals/hooks";

function money(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">{title}</div>
      {children}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardSummary();
  const decideApproval = useDecideApproval();

  if (isLoading || !data) return <Spinner />;

  const hasOverdue = data.overdueMilestones.length + data.overdueTasks.length + data.overdueRfis.length > 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        description="Here's what needs your attention today."
      />

      {data.kpis && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-ink-400">Active projects</div>
            <div className="mt-1 text-xl font-semibold text-ink-900">{data.activeProjectsCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-ink-400">Total fee value</div>
            <div className="mt-1 text-xl font-semibold text-ink-900">{money(data.kpis.totalRevenue)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-ink-400">Team utilization</div>
            <div className="mt-1 text-xl font-semibold text-ink-900">{data.kpis.teamUtilizationRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-ink-400">On-time delivery</div>
            <div className="mt-1 text-xl font-semibold text-ink-900">{data.kpis.onTimeDeliveryRate}%</div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.myPendingApprovals.length > 0 && (
          <SectionCard title="Pending your approval">
            {data.myPendingApprovals.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">
                    {a.entityType} approval requested by {a.requestedBy.name}
                  </div>
                  <div className="text-xs text-ink-500">{format(new Date(a.createdAt), "d MMM yyyy")}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => decideApproval.mutate({ id: a.id, decision: "APPROVED" })}>
                    <Check size={15} />
                  </Button>
                  <Button variant="ghost" onClick={() => decideApproval.mutate({ id: a.id, decision: "REJECTED" })}>
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {hasOverdue && (
          <SectionCard title="Overdue">
            {data.overdueMilestones.map((m) => (
              <Link key={m.id} to={`/projects/${m.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="text-xs text-ink-500">{m.project.name} · Milestone</div>
                </div>
                <StatusPill status="OVERDUE" />
              </Link>
            ))}
            {data.overdueTasks.map((t) => (
              <Link key={t.id} to={`/projects/${t.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{t.title}</div>
                  <div className="text-xs text-ink-500">{t.project.name} · Task · {t.assignee?.name ?? "Unassigned"}</div>
                </div>
                <StatusPill status="OVERDUE" />
              </Link>
            ))}
            {data.overdueRfis.map((r) => (
              <Link key={r.id} to={`/projects/${r.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{r.question}</div>
                  <div className="text-xs text-ink-500">{r.project.name} · RFI</div>
                </div>
                <StatusPill status="OVERDUE" />
              </Link>
            ))}
          </SectionCard>
        )}

        <SectionCard title="Upcoming deadlines (14 days)">
          {data.upcomingMilestones.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-500">Nothing due soon.</div>
          ) : (
            data.upcomingMilestones.map((m) => (
              <Link key={m.id} to={`/projects/${m.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="text-xs text-ink-500">{m.project.name}</div>
                </div>
                <div className="text-xs text-ink-500">{format(new Date(m.dueDate), "d MMM")}</div>
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard title="Consultant submissions pending">
          {data.pendingDeliverables.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-500">Nothing pending.</div>
          ) : (
            data.pendingDeliverables.map((d) => (
              <Link key={d.id} to={`/projects/${d.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{d.title}</div>
                  <div className="text-xs text-ink-500">
                    {d.project.name} · {d.consultant?.name}
                  </div>
                </div>
                <StatusPill status={d.status} />
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard title="Today's meetings">
          {data.todaysMeetings.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-500">No meetings today.</div>
          ) : (
            data.todaysMeetings.map((m) => (
              <Link key={m.id} to={`/projects/${m.project.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                <div>
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="text-xs text-ink-500">{m.project.name}</div>
                </div>
                <div className="text-xs text-ink-500">{format(new Date(m.date), "h:mm a")}</div>
              </Link>
            ))
          )}
        </SectionCard>

        {data.kpis && (
          <SectionCard title="Revenue by typology">
            {Object.entries(data.kpis.revenueByTypology).length === 0 ? (
              <EmptyState title="No revenue data yet" />
            ) : (
              Object.entries(data.kpis.revenueByTypology).map(([typology, revenue]) => (
                <div key={typology} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                  <span className="text-sm text-ink-900">{typology}</span>
                  <span className="text-sm font-medium text-ink-900">{money(revenue)}</span>
                </div>
              ))
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
