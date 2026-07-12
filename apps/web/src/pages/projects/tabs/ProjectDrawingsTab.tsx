import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { DRAWING_STATUSES } from "@apms/shared";
import { Card, Button, StatusPill, Modal, Field, Label, Input, Select } from "../../../components/ui";
import { useAuth } from "../../../auth/AuthContext";
import { useDrawings, useCreateDrawing, useUpdateDrawing } from "../../../features/drawings/hooks";

export function ProjectDrawingsTab({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const { data: drawings } = useDrawings(projectId);
  const updateDrawing = useUpdateDrawing();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {can("MANAGE_DOCUMENTS") && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New drawing
          </Button>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 font-medium">Drawing no.</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Revision</th>
              <th className="px-5 py-3 font-medium">Issued to</th>
              <th className="px-5 py-3 font-medium">Issue date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {drawings?.map((d) => (
              <tr key={d.id} className="border-b border-ink-100 last:border-0">
                <td className="px-5 py-3 font-medium text-ink-900">{d.drawingNumber}</td>
                <td className="px-5 py-3 text-ink-700">{d.title}</td>
                <td className="px-5 py-3 text-ink-600">{d.revision}</td>
                <td className="px-5 py-3 text-ink-600">{d.issuedTo ?? "—"}</td>
                <td className="px-5 py-3 text-ink-600">
                  {d.issueDate ? format(new Date(d.issueDate), "d MMM yyyy") : "—"}
                </td>
                <td className="px-5 py-3">
                  {can("MANAGE_DOCUMENTS") ? (
                    <Select
                      value={d.status}
                      className="w-32"
                      onChange={(e) => updateDrawing.mutate({ id: d.id, status: e.target.value as (typeof DRAWING_STATUSES)[number] })}
                    >
                      {DRAWING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <StatusPill status={d.status} />
                  )}
                </td>
              </tr>
            ))}
            {!drawings?.length && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                  No drawings registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <NewDrawingModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
    </div>
  );
}

function NewDrawingModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const createDrawing = useCreateDrawing();
  const [drawingNumber, setDrawingNumber] = useState("");
  const [title, setTitle] = useState("");
  const [revision, setRevision] = useState("R1");
  const [issuedTo, setIssuedTo] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!drawingNumber || !title || !revision) return;
    await createDrawing.mutateAsync({ projectId, drawingNumber, title, revision, issuedTo: issuedTo || undefined });
    setDrawingNumber("");
    setTitle("");
    setRevision("R1");
    setIssuedTo("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New drawing register entry">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Drawing number</Label>
          <Input value={drawingNumber} onChange={(e) => setDrawingNumber(e.target.value)} required />
        </Field>
        <Field>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Revision</Label>
            <Input value={revision} onChange={(e) => setRevision(e.target.value)} required />
          </Field>
          <Field>
            <Label>Issued to</Label>
            <Input value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} />
          </Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createDrawing.isPending}>
            {createDrawing.isPending ? "Adding…" : "Add drawing"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
