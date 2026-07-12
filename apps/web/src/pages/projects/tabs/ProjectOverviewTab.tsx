import { Card, StatusPill } from "../../../components/ui";
import type { ProjectDetailDto } from "../../../features/projects/types";
import { format } from "date-fns";

function formatFee(fee: number | null) {
  if (fee == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    fee
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink-900">{value}</div>
    </div>
  );
}

export function ProjectOverviewTab({ project }: { project: ProjectDetailDto }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-2 p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Project details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Stat label="Typology" value={project.typology} />
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-400">Status</div>
            <div className="mt-1">
              <StatusPill status={project.status} />
            </div>
          </div>
          <Stat label="Site address" value={project.siteAddress ?? "—"} />
          <Stat label="Fee" value={formatFee(project.fee)} />
          <Stat label="Start date" value={project.startDate ? format(new Date(project.startDate), "d MMM yyyy") : "—"} />
          <Stat label="End date" value={project.endDate ? format(new Date(project.endDate), "d MMM yyyy") : "—"} />
        </div>
        {project.scope && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-ink-400">Scope</div>
            <p className="mt-1 text-sm text-ink-700">{project.scope}</p>
          </div>
        )}
        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-wide text-ink-400">Phase progress</div>
          <div className="flex flex-wrap gap-2">
            {project.phases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5">
                <span className="text-xs font-medium text-ink-700">{phase.name}</span>
                <StatusPill status={phase.status} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Team</h3>
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-ink-400">Lead architect</div>
          <div className="mt-1 text-sm text-ink-900">{project.leadArchitect?.name ?? "Unassigned"}</div>
        </div>
        <div className="text-xs uppercase tracking-wide text-ink-400">Members</div>
        <ul className="mt-2 space-y-2">
          {project.members.length === 0 && <li className="text-sm text-ink-500">No members added yet.</li>}
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-900">{m.user.name}</span>
              <span className="text-ink-500">{m.roleOnProject ?? m.user.role}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
