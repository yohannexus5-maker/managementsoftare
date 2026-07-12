import { useState } from "react";
import { PageHeader, Card, StatusPill } from "../../components/ui";
import { useTeamMembers, useWorkload } from "../../features/team/hooks";

const FLAG_LABEL: Record<string, string> = {
  OVER_ALLOCATED: "OVERDUE",
  UNDER_ALLOCATED: "PENDING",
  NORMAL: "APPROVED",
};

export default function TeamPage() {
  const [tab, setTab] = useState<"directory" | "workload">("directory");
  const { data: members } = useTeamMembers();
  const { data: workload } = useWorkload();

  return (
    <div>
      <PageHeader title="Team" description="Staff directory and current workload across the practice." />

      <div className="mb-6 flex gap-1 border-b border-ink-200">
        {[
          { key: "directory", label: "Directory" },
          { key: "workload", label: "Workload" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "border-ink-900 text-ink-900" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "directory" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members?.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="text-base font-semibold text-ink-900">{m.name}</div>
              <div className="text-sm text-ink-500">{m.seniority ?? m.role.replace(/_/g, " ")}</div>
              <div className="mt-1 text-xs text-ink-400">{m.email}</div>
              {m.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.skills.map((s) => (
                    <span key={s.id} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "workload" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Team member</th>
                <th className="px-5 py-3 font-medium">Active projects</th>
                <th className="px-5 py-3 font-medium">Active tasks</th>
                <th className="px-5 py-3 font-medium">Hours (last 7d)</th>
                <th className="px-5 py-3 font-medium">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {workload?.map((w) => (
                <tr key={w.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-900">{w.name}</td>
                  <td className="px-5 py-3 text-ink-600">{w.activeProjectCount}</td>
                  <td className="px-5 py-3 text-ink-600">{w.activeTaskCount}</td>
                  <td className="px-5 py-3 text-ink-600">{w.hoursLastWeek}h</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-900">{w.utilizationPct}%</span>
                      {w.flag !== "NORMAL" && <StatusPill status={FLAG_LABEL[w.flag]} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
