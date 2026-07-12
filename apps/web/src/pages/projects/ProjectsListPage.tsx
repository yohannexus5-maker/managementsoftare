import { useState } from "react";
import { Link } from "react-router-dom";
import { PROJECT_STATUSES } from "@apms/shared";
import { PageHeader, Card, Button, StatusPill, EmptyState, Spinner, Select } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { useProjects } from "../../features/projects/hooks";
import { NewProjectModal } from "./NewProjectModal";

function formatFee(fee: number | null) {
  if (fee == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    fee
  );
}

export default function ProjectsListPage() {
  const { can } = useAuth();
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: projects, isLoading } = useProjects(status ? { status } : undefined);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every active and past engagement across the practice."
        actions={
          <>
            <Link to="/projects/timeline">
              <Button variant="secondary">Timeline</Button>
            </Link>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
            {can("MANAGE_PROJECT") && <Button onClick={() => setModalOpen(true)}>New project</Button>}
          </>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !projects?.length ? (
        <EmptyState title="No projects yet" description="Create your first project to get started." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Typology</th>
                <th className="px-5 py-3 font-medium">Phase</th>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const currentPhase = p.phases.find((ph) => ph.status === "IN_PROGRESS") ?? p.phases[0];
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link to={`/projects/${p.id}`} className="font-medium text-ink-900 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{p.client.name}</td>
                    <td className="px-5 py-3 text-ink-600">{p.typology}</td>
                    <td className="px-5 py-3 text-ink-600">{currentPhase?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-600">{p.leadArchitect?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-600">{formatFee(p.fee)}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
