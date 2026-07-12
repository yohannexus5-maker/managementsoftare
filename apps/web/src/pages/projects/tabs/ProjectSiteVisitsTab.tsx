import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Camera } from "lucide-react";
import { Card, Button, Modal, Field, Label, Input, Textarea, StatusPill } from "../../../components/ui";
import { useSiteVisits, useCreateSiteVisit } from "../../../features/sitevisits/hooks";
import { api } from "../../../lib/api";
import { openDocument } from "../../../features/documents/hooks";

export function ProjectSiteVisitsTab({ projectId }: { projectId: string }) {
  const { data: siteVisits, refetch } = useSiteVisits(projectId);
  const [modalOpen, setModalOpen] = useState(false);

  async function handlePhotoUpload(siteVisitId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/sitevisits/${siteVisitId}/photos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    refetch();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Log site visit
        </Button>
      </div>
      <div className="space-y-3">
        {siteVisits?.map((sv) => (
          <Card key={sv.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-ink-900">
                {format(new Date(sv.date), "d MMM yyyy")} · {sv.visitedBy.name}
              </div>
              <label className="cursor-pointer text-ink-500 hover:text-ink-800">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(sv.id, file);
                  }}
                />
              </label>
            </div>
            <p className="text-sm text-ink-700">{sv.notes}</p>
            {sv.actionItems.length > 0 && (
              <div className="mt-3 space-y-1">
                {sv.actionItems.map((ai) => (
                  <div key={ai.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">{ai.description}</span>
                    <StatusPill status={ai.status} />
                  </div>
                ))}
              </div>
            )}
            {sv.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sv.photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openDocument(p.id)}
                    className="rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-600 hover:bg-ink-50"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
        {!siteVisits?.length && <div className="py-8 text-center text-sm text-ink-500">No site visits logged yet.</div>}
      </div>
      <NewSiteVisitModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
    </div>
  );
}

function NewSiteVisitModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const createSiteVisit = useCreateSiteVisit();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [actionItem, setActionItem] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!notes) return;
    await createSiteVisit.mutateAsync({
      projectId,
      date: new Date(date),
      notes,
      actionItems: actionItem ? [{ description: actionItem }] : undefined,
    });
    setNotes("");
    setActionItem("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log site visit">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field>
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} required />
        </Field>
        <Field>
          <Label>Action item (optional)</Label>
          <Input value={actionItem} onChange={(e) => setActionItem(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSiteVisit.isPending}>
            {createSiteVisit.isPending ? "Logging…" : "Log visit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
