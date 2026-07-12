import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Card, Button, StatusPill, Modal, Field, Label, Input, Textarea } from "../../../components/ui";
import { useMeetings, useCreateMeeting, useUpdateMeetingMinutes } from "../../../features/meetings/hooks";

export function ProjectMeetingsTab({ projectId }: { projectId: string }) {
  const { data: meetings } = useMeetings(projectId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [minutesDraft, setMinutesDraft] = useState("");
  const [actionItemDraft, setActionItemDraft] = useState("");
  const updateMinutes = useUpdateMeetingMinutes();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Schedule meeting
        </Button>
      </div>
      <div className="space-y-3">
        {meetings?.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-ink-900">{m.title}</div>
                <div className="text-xs text-ink-500">
                  {format(new Date(m.date), "d MMM yyyy")} {m.location && `· ${m.location}`}
                </div>
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {m.participants.map((p) => (
                <span key={p.id} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                  {p.user?.name ?? p.name}
                </span>
              ))}
            </div>
            {m.minutes && <p className="mb-2 text-sm text-ink-700">{m.minutes}</p>}
            {m.actionItems.length > 0 && (
              <div className="mb-2 space-y-1">
                {m.actionItems.map((ai) => (
                  <div key={ai.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">{ai.description}</span>
                    <StatusPill status={ai.status} />
                  </div>
                ))}
              </div>
            )}
            {editingId === m.id ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Minutes of meeting…"
                  value={minutesDraft}
                  onChange={(e) => setMinutesDraft(e.target.value)}
                />
                <Input
                  placeholder="Add action item (optional)"
                  value={actionItemDraft}
                  onChange={(e) => setActionItemDraft(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await updateMinutes.mutateAsync({
                        id: m.id,
                        minutes: minutesDraft,
                        actionItems: actionItemDraft ? [{ description: actionItemDraft }] : undefined,
                      });
                      setEditingId(null);
                      setMinutesDraft("");
                      setActionItemDraft("");
                    }}
                  >
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(m.id);
                  setMinutesDraft(m.minutes ?? "");
                }}
              >
                {m.minutes ? "Update MoM" : "Add MoM"}
              </Button>
            )}
          </Card>
        ))}
        {!meetings?.length && <div className="py-8 text-center text-sm text-ink-500">No meetings scheduled yet.</div>}
      </div>
      <NewMeetingModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
    </div>
  );
}

function NewMeetingModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title) return;
    await createMeeting.mutateAsync({ projectId, title, date: new Date(date), location: location || undefined });
    setTitle("");
    setLocation("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule meeting">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMeeting.isPending}>
            {createMeeting.isPending ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
