import { useMemo } from "react";
import { Link } from "react-router-dom";
import { differenceInCalendarDays, addMonths, format, startOfMonth } from "date-fns";
import { PageHeader, Card, Spinner, EmptyState } from "../../components/ui";
import { useProjects } from "../../features/projects/hooks";

const PHASE_COLORS = [
  "bg-ink-300",
  "bg-accent-500",
  "bg-ok-600",
  "bg-warn-600",
  "bg-danger-600",
  "bg-ink-600",
  "bg-accent-700",
];

export default function TimelinePage() {
  const { data: projects, isLoading } = useProjects({ status: "ACTIVE" });

  const { rangeStart, rangeEnd, months } = useMemo(() => {
    const allDates: Date[] = [];
    projects?.forEach((p) => {
      p.phases.forEach((ph) => {
        if (ph.startDate) allDates.push(new Date(ph.startDate));
        if (ph.endDate) allDates.push(new Date(ph.endDate));
      });
    });
    if (allDates.length === 0) {
      const now = new Date();
      return { rangeStart: now, rangeEnd: addMonths(now, 6), months: [] as Date[] };
    }
    const start = startOfMonth(new Date(Math.min(...allDates.map((d) => d.getTime()))));
    const end = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const monthList: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      monthList.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return { rangeStart: start, rangeEnd: end, months: monthList };
  }, [projects]);

  const totalDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart));

  function toPct(date: Date) {
    return (differenceInCalendarDays(date, rangeStart) / totalDays) * 100;
  }

  return (
    <div>
      <PageHeader title="Timeline" description="Phase overlap across every active project." />
      {isLoading ? (
        <Spinner />
      ) : !projects?.length ? (
        <EmptyState title="No active projects" />
      ) : (
        <Card className="overflow-x-auto p-6">
          <div className="min-w-[900px]">
            <div className="mb-2 flex border-b border-ink-200 pb-2 pl-48">
              {months.map((m) => (
                <div key={m.toISOString()} className="flex-1 text-xs text-ink-400">
                  {format(m, "MMM yyyy")}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center">
                  <Link
                    to={`/projects/${p.id}`}
                    className="w-48 shrink-0 truncate pr-3 text-sm font-medium text-ink-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="relative h-6 flex-1 rounded bg-ink-50">
                    {p.phases.map((phase, i) => {
                      if (!phase.startDate || !phase.endDate) return null;
                      const left = toPct(new Date(phase.startDate));
                      const width = Math.max(1, toPct(new Date(phase.endDate)) - left);
                      return (
                        <div
                          key={phase.id}
                          title={`${phase.name}: ${format(new Date(phase.startDate), "d MMM yyyy")} – ${format(new Date(phase.endDate), "d MMM yyyy")}`}
                          className={`absolute top-0.5 h-5 rounded ${PHASE_COLORS[i % PHASE_COLORS.length]} ${
                            phase.status === "IN_PROGRESS" ? "ring-2 ring-ink-900" : ""
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
