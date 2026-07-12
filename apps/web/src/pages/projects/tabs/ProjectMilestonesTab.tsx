import { useState, type FormEvent } from "react";
import { format, isPast } from "date-fns";
import { Plus, Trash2, Check } from "lucide-react";
import { Card, Button, StatusPill, Input, Select, Field, Label } from "../../../components/ui";
import { useAuth } from "../../../auth/AuthContext";
import type { ProjectDetailDto } from "../../../features/projects/types";
import {
  useCreateMilestone,
  useDeleteMilestone,
  useUpdateMilestone,
  useUpdatePhase,
} from "../../../features/projects/hooks";

export function ProjectMilestonesTab({ project }: { project: ProjectDetailDto }) {
  const { can } = useAuth();
  const canManage = can("MANAGE_PROJECT");
  const updatePhase = useUpdatePhase(project.id);
  const createMilestone = useCreateMilestone(project.id);
  const updateMilestone = useUpdateMilestone(project.id);
  const deleteMilestone = useDeleteMilestone(project.id);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [phaseId, setPhaseId] = useState("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title || !dueDate) return;
    await createMilestone.mutateAsync({ title, dueDate: new Date(dueDate), phaseId: phaseId || undefined });
    setTitle("");
    setDueDate("");
    setPhaseId("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-2 p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Phases</h3>
        <div className="space-y-2">
          {project.phases.map((phase) => (
            <div
              key={phase.id}
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-2.5"
            >
              <div>
                <div className="text-sm font-medium text-ink-900">{phase.name}</div>
                <div className="text-xs text-ink-500">
                  {phase.startDate ? format(new Date(phase.startDate), "d MMM yyyy") : "—"} –{" "}
                  {phase.endDate ? format(new Date(phase.endDate), "d MMM yyyy") : "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={phase.status} />
                {canManage && phase.status !== "COMPLETE" && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      updatePhase.mutate({
                        id: phase.id,
                        status: phase.status === "PENDING" ? "IN_PROGRESS" : "COMPLETE",
                      })
                    }
                  >
                    {phase.status === "PENDING" ? "Start" : "Mark complete"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 className="mb-4 mt-8 text-sm font-semibold text-ink-900">Milestones</h3>
        <div className="space-y-2">
          {project.milestones.length === 0 && <div className="text-sm text-ink-500">No milestones yet.</div>}
          {project.milestones.map((m) => {
            const overdue = m.status !== "DONE" && isPast(new Date(m.dueDate));
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-2.5"
              >
                <div>
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="text-xs text-ink-500">Due {format(new Date(m.dueDate), "d MMM yyyy")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={overdue ? "OVERDUE" : m.status} />
                  {m.status !== "DONE" && (
                    <Button
                      variant="ghost"
                      onClick={() => updateMilestone.mutate({ id: m.id, status: "DONE" })}
                      title="Mark done"
                    >
                      <Check size={15} />
                    </Button>
                  )}
                  {canManage && (
                    <Button variant="ghost" onClick={() => deleteMilestone.mutate(m.id)} title="Delete">
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Add milestone</h3>
        <form onSubmit={handleAdd}>
          <Field>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field>
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </Field>
          <Field>
            <Label>Phase (optional)</Label>
            <Select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
              <option value="">No specific phase</option>
              {project.phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" className="w-full justify-center" disabled={createMilestone.isPending}>
            <Plus size={15} /> Add milestone
          </Button>
        </form>
      </Card>
    </div>
  );
}
