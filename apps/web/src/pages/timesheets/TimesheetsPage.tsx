import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Check, X } from "lucide-react";
import { LEAVE_TYPES } from "@apms/shared";
import { PageHeader, Card, Button, StatusPill, Modal, Field, Label, Input, Select, Textarea } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { useTimesheets, useLogTimesheet, useDecideTimesheet } from "../../features/timesheets/hooks";
import { useLeaveRequests, useRequestLeave, useDecideLeave } from "../../features/leave/hooks";
import { useProjects } from "../../features/projects/hooks";

export default function TimesheetsPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState<"mine" | "approvals" | "leave">("mine");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const canApprove = can("APPROVE_LEAVE") || can("MANAGE_PROJECT") || can("MANAGE_FINANCIALS");

  const { data: mine } = useTimesheets({ mine: true });
  const { data: pending } = useTimesheets({ approvalStatus: "PENDING" });
  const { data: myLeave } = useLeaveRequests({ mine: true });
  const { data: pendingLeave } = useLeaveRequests({ status: "PENDING" });
  const decideTimesheet = useDecideTimesheet();
  const decideLeave = useDecideLeave();

  return (
    <div>
      <PageHeader
        title="Timesheets & Leave"
        description="Log hours against projects and manage leave requests."
        actions={
          <>
            <Button variant="secondary" onClick={() => setLeaveModalOpen(true)}>
              Request leave
            </Button>
            <Button onClick={() => setLogModalOpen(true)}>
              <Plus size={15} /> Log time
            </Button>
          </>
        }
      />

      <div className="mb-6 flex gap-1 border-b border-ink-200">
        {[
          { key: "mine", label: "My timesheets" },
          ...(canApprove ? [{ key: "approvals" as const, label: "Pending approval" }] : []),
          { key: "leave", label: "Leave" },
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

      {tab === "mine" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Hours</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mine?.map((ts) => (
                <tr key={ts.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 text-ink-600">{format(new Date(ts.date), "d MMM yyyy")}</td>
                  <td className="px-5 py-3 text-ink-900">{ts.project.name}</td>
                  <td className="px-5 py-3 text-ink-900">{ts.hours}h</td>
                  <td className="px-5 py-3">
                    <StatusPill status={ts.approvalStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "approvals" && canApprove && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Team member</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Hours</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pending?.map((ts) => (
                <tr key={ts.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 text-ink-900">{ts.user.name}</td>
                  <td className="px-5 py-3 text-ink-600">{format(new Date(ts.date), "d MMM yyyy")}</td>
                  <td className="px-5 py-3 text-ink-600">{ts.project.name}</td>
                  <td className="px-5 py-3 text-ink-900">{ts.hours}h</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => decideTimesheet.mutate({ id: ts.id, approvalStatus: "APPROVED" })}
                      >
                        <Check size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => decideTimesheet.mutate({ id: ts.id, approvalStatus: "REJECTED" })}
                      >
                        <X size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pending?.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-500">
                    Nothing pending approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "leave" && (
        <div className="space-y-6">
          {canApprove && (
            <Card className="overflow-hidden">
              <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">
                Pending leave approvals
              </div>
              {!pendingLeave?.length ? (
                <div className="px-5 py-6 text-center text-sm text-ink-500">Nothing pending.</div>
              ) : (
                pendingLeave.map((lr) => (
                  <div key={lr.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-ink-900">{lr.user.name}</div>
                      <div className="text-xs text-ink-500">
                        {lr.type} · {format(new Date(lr.startDate), "d MMM")} – {format(new Date(lr.endDate), "d MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => decideLeave.mutate({ id: lr.id, status: "APPROVED" })}>
                        <Check size={15} />
                      </Button>
                      <Button variant="ghost" onClick={() => decideLeave.mutate({ id: lr.id, status: "REJECTED" })}>
                        <X size={15} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
          <Card className="overflow-hidden">
            <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">My leave requests</div>
            {!myLeave?.length ? (
              <div className="px-5 py-6 text-center text-sm text-ink-500">No leave requests yet.</div>
            ) : (
              myLeave.map((lr) => (
                <div key={lr.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-ink-900">{lr.type}</div>
                    <div className="text-xs text-ink-500">
                      {format(new Date(lr.startDate), "d MMM")} – {format(new Date(lr.endDate), "d MMM yyyy")}
                    </div>
                  </div>
                  <StatusPill status={lr.status} />
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      <LogTimeModal open={logModalOpen} onClose={() => setLogModalOpen(false)} />
      <RequestLeaveModal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} />
    </div>
  );
}

function LogTimeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: projects } = useProjects();
  const logTime = useLogTimesheet();
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !hours) return;
    await logTime.mutateAsync({ projectId, date: new Date(date), hours: Number(hours), notes: notes || undefined });
    setHours("");
    setNotes("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log time">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field>
            <Label>Hours</Label>
            <Input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
          </Field>
        </div>
        <Field>
          <Label>Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={logTime.isPending}>
            {logTime.isPending ? "Logging…" : "Log time"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RequestLeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const requestLeave = useRequestLeave();
  const [type, setType] = useState<string>(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    await requestLeave.mutateAsync({
      type: type as (typeof LEAVE_TYPES)[number],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || undefined,
    });
    setStartDate("");
    setEndDate("");
    setReason("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Request leave">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field>
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </Field>
        </div>
        <Field>
          <Label>Reason</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={requestLeave.isPending}>
            {requestLeave.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
