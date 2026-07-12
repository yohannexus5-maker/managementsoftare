import { useState, type FormEvent } from "react";
import { format, isPast } from "date-fns";
import { Plus } from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@apms/shared";
import { PageHeader, Card, Button, Modal, Field, Label, Input, Select, Textarea } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { useTasks, useUpdateTask, useCreateTask } from "../../features/tasks/hooks";
import { useProjects } from "../../features/projects/hooks";
import { useTeamMembers } from "../../features/team/hooks";

const COLUMN_LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  DONE: "Done",
};

const PRIORITY_TONE: Record<string, string> = {
  LOW: "text-ink-400",
  MEDIUM: "text-ink-600",
  HIGH: "text-warn-600",
  URGENT: "text-danger-600",
};

export default function TasksPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: tasks } = useTasks(scope === "mine" ? { assigneeId: user?.id } : undefined);
  const updateTask = useUpdateTask();

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Work assigned across every active project."
        actions={
          <>
            <Select value={scope} onChange={(e) => setScope(e.target.value as "mine" | "all")} className="w-36">
              <option value="mine">My tasks</option>
              <option value="all">All tasks</option>
            </Select>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} /> New task
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks?.filter((t) => t.status === status) ?? [];
          return (
            <div key={status}>
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-ink-700">{COLUMN_LABELS[status]}</span>
                <span className="text-xs text-ink-400">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => {
                  const overdue = task.dueDate && task.status !== "DONE" && isPast(new Date(task.dueDate));
                  return (
                    <Card key={task.id} className="p-3">
                      <div className="mb-1 text-xs text-ink-400">{task.project.name}</div>
                      <div className="text-sm font-medium text-ink-900">{task.title}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className={PRIORITY_TONE[task.priority]}>{task.priority}</span>
                        {task.dueDate && (
                          <span className={overdue ? "text-danger-600 font-medium" : "text-ink-500"}>
                            {format(new Date(task.dueDate), "d MMM")}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <div className="mt-1 text-xs text-ink-500">{task.assignee.name}</div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {TASK_STATUSES.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateTask.mutate({ id: task.id, status: s })}
                            className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-500 hover:bg-ink-100"
                          >
                            → {COLUMN_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-ink-200 py-6 text-center text-xs text-ink-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: projects } = useProjects();
  const { data: members } = useTeamMembers();
  const createTask = useCreateTask();

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !title) return;
    await createTask.mutateAsync({
      projectId,
      title,
      description: description || undefined,
      assigneeId: assigneeId || undefined,
      priority: priority as (typeof TASK_PRIORITIES)[number],
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Project</Label>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="">Select project…</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field>
          <Label>Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Assignee</Label>
            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field>
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? "Creating…" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
