import { Card, StatusPill, Select } from "../../../components/ui";
import type { ProjectDetailDto } from "../../../features/projects/types";
import { useUpdateStatutoryItem } from "../../../features/projects/hooks";
import { useAuth } from "../../../auth/AuthContext";

const STATUTORY_ITEM_STATUSES = ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"] as const;

export function ProjectStatutoryTab({ project }: { project: ProjectDetailDto }) {
  const { can } = useAuth();
  const canManage = can("MANAGE_PROJECT") || can("MANAGE_ADMIN_CONFIG");
  const update = useUpdateStatutoryItem(project.id);

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-5 py-3 font-medium">Approval / submission</th>
            <th className="px-5 py-3 font-medium">Jurisdiction</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {project.statutoryItems.map((item) => (
            <tr key={item.id} className="border-b border-ink-100 last:border-0">
              <td className="px-5 py-3 font-medium text-ink-900">{item.name}</td>
              <td className="px-5 py-3 text-ink-600">{item.jurisdiction ?? "—"}</td>
              <td className="px-5 py-3">
                {canManage ? (
                  <Select
                    value={item.status}
                    className="w-40"
                    onChange={(e) => update.mutate({ id: item.id, status: e.target.value })}
                  >
                    {STATUTORY_ITEM_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <StatusPill status={item.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
