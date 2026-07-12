import { useState } from "react";
import { format, isPast } from "date-fns";
import { UserPlus, X } from "lucide-react";
import { Card, Button, StatusPill, Select } from "../../../components/ui";
import { useAuth } from "../../../auth/AuthContext";
import type { ProjectDetailDto } from "../../../features/projects/types";
import { useTasks } from "../../../features/tasks/hooks";
import { useTeamMembers } from "../../../features/team/hooks";
import { api } from "../../../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function ProjectTeamTasksTab({ project }: { project: ProjectDetailDto }) {
  const { can } = useAuth();
  const canManage = can("MANAGE_TEAM") || can("MANAGE_PROJECT");
  const { data: tasks } = useTasks({ projectId: project.id });
  const { data: allMembers } = useTeamMembers();
  const qc = useQueryClient();
  const [addingMember, setAddingMember] = useState("");

  const memberIds = new Set(project.members.map((m) => m.userId));
  const addableMembers = allMembers?.filter((m) => !memberIds.has(m.id)) ?? [];

  async function handleAddMember() {
    if (!addingMember) return;
    await api.post(`/projects/${project.id}/members`, { userId: addingMember });
    qc.invalidateQueries({ queryKey: ["projects", project.id] });
    setAddingMember("");
  }

  async function handleRemoveMember(userId: string) {
    await api.delete(`/projects/${project.id}/members/${userId}`);
    qc.invalidateQueries({ queryKey: ["projects", project.id] });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-2 overflow-x-auto">
        <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">Project tasks</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-5 py-3 font-medium">Assignee</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.map((t) => {
              const overdue = t.dueDate && t.status !== "DONE" && isPast(new Date(t.dueDate));
              return (
                <tr key={t.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-900">{t.title}</td>
                  <td className="px-5 py-3 text-ink-600">{t.assignee?.name ?? "Unassigned"}</td>
                  <td className={`px-5 py-3 ${overdue ? "text-danger-600 font-medium" : "text-ink-600"}`}>
                    {t.dueDate ? format(new Date(t.dueDate), "d MMM yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={t.status} />
                  </td>
                </tr>
              );
            })}
            {!tasks?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink-500">
                  No tasks on this project yet — use the Tasks page to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Project team</h3>
        <ul className="space-y-2">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="text-ink-900">{m.user.name}</div>
                <div className="text-xs text-ink-500">{m.roleOnProject ?? m.user.role}</div>
              </div>
              {canManage && (
                <button onClick={() => handleRemoveMember(m.userId)} className="text-ink-400 hover:text-danger-600">
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {canManage && (
          <div className="mt-4 flex gap-2">
            <Select value={addingMember} onChange={(e) => setAddingMember(e.target.value)} className="flex-1">
              <option value="">Add member…</option>
              {addableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={handleAddMember}>
              <UserPlus size={15} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
