import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Users, HardHat, Plane, MessageCircleQuestion } from "lucide-react";
import { PageHeader, Card, Select, Spinner, EmptyState } from "../../components/ui";
import { useCalendarEvents } from "../../features/calendar/hooks";

const TYPE_ICON: Record<string, typeof CalendarDays> = {
  MILESTONE: CalendarDays,
  MEETING: Users,
  SITE_VISIT: HardHat,
  LEAVE: Plane,
  RFI_DUE: MessageCircleQuestion,
};

const TYPE_LABEL: Record<string, string> = {
  MILESTONE: "Milestone",
  MEETING: "Meeting",
  SITE_VISIT: "Site visit",
  LEAVE: "Leave",
  RFI_DUE: "RFI due",
};

export default function CalendarPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const { start, end } = useMemo(() => {
    const now = new Date();
    return { start: now, end: new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000) };
  }, [rangeDays]);
  const { data: events, isLoading } = useCalendarEvents(start, end);

  const grouped = useMemo(() => {
    if (!events) return [];
    const groups: { date: Date; events: typeof events }[] = [];
    events.forEach((e) => {
      const eventDate = new Date(e.date);
      const existing = groups.find((g) => isSameDay(g.date, eventDate));
      if (existing) existing.events.push(e);
      else groups.push({ date: eventDate, events: [e] });
    });
    return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Site visits, consultant meetings, submission deadlines, and team leave in one place."
        actions={
          <Select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} className="w-40">
            <option value={7}>Next 7 days</option>
            <option value={30}>Next 30 days</option>
            <option value={90}>Next 90 days</option>
          </Select>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !grouped.length ? (
        <EmptyState title="Nothing scheduled" description="No events in this range." />
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <Card key={g.date.toISOString()} className="overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {format(g.date, "EEEE, d MMMM yyyy")}
              </div>
              {g.events.map((e) => {
                const Icon = TYPE_ICON[e.type];
                const content = (
                  <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
                    <Icon size={16} className="text-ink-400" />
                    <div>
                      <div className="text-sm font-medium text-ink-900">{e.title}</div>
                      <div className="text-xs text-ink-500">
                        {TYPE_LABEL[e.type]}
                        {e.projectName && ` · ${e.projectName}`}
                      </div>
                    </div>
                  </div>
                );
                return e.projectId ? (
                  <Link key={e.id} to={`/projects/${e.projectId}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={e.id}>{content}</div>
                );
              })}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
