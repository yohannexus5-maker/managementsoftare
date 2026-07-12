import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Card, Button, StatusPill, Modal, Field, Label, Input, Textarea } from "../../../components/ui";
import { useAuth } from "../../../auth/AuthContext";
import { useRfis, useCreateRfi, useRespondRfi, useCloseRfi } from "../../../features/rfis/hooks";
import { useConsultants } from "../../../features/consultants/hooks";

export function ProjectRfisTab({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const { data: rfis } = useRfis(projectId);
  const respondRfi = useRespondRfi();
  const closeRfi = useCloseRfi();
  const [modalOpen, setModalOpen] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Raise RFI
        </Button>
      </div>
      <div className="space-y-3">
        {rfis?.map((rfi) => (
          <Card key={rfi.id} className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-xs text-ink-400">
                  Raised by {rfi.raisedBy.name} to {rfi.raisedTo} ·{" "}
                  {format(new Date(rfi.createdAt), "d MMM yyyy")}
                </div>
                <div className="mt-1 text-sm font-medium text-ink-900">{rfi.question}</div>
              </div>
              <StatusPill status={rfi.status} />
            </div>
            {rfi.response && (
              <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">↳ {rfi.response}</div>
            )}
            {rfi.status === "OPEN" && can("RESPOND_RFI") && (
              <div className="mt-3">
                {responding === rfi.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type response…"
                      className="flex-1"
                    />
                    <Button
                      onClick={async () => {
                        await respondRfi.mutateAsync({ id: rfi.id, response: responseText });
                        setResponding(null);
                        setResponseText("");
                      }}
                    >
                      Send
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setResponding(rfi.id)}>
                    Respond
                  </Button>
                )}
              </div>
            )}
            {rfi.status === "RESPONDED" && (
              <div className="mt-3">
                <Button variant="ghost" onClick={() => closeRfi.mutate(rfi.id)}>
                  Close RFI
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!rfis?.length && <div className="py-8 text-center text-sm text-ink-500">No RFIs raised yet.</div>}
      </div>
      <NewRfiModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
    </div>
  );
}

function NewRfiModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const { data: consultants } = useConsultants();
  const createRfi = useCreateRfi();
  const [raisedTo, setRaisedTo] = useState("");
  const [consultantId, setConsultantId] = useState("");
  const [question, setQuestion] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!raisedTo || !question) return;
    await createRfi.mutateAsync({ projectId, raisedTo, question, consultantId: consultantId || undefined });
    setRaisedTo("");
    setQuestion("");
    setConsultantId("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Raise RFI">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Raised to (consultant, contractor, etc.)</Label>
          <Input
            value={raisedTo}
            onChange={(e) => {
              setRaisedTo(e.target.value);
              const match = consultants?.find((c) => c.name === e.target.value);
              setConsultantId(match?.id ?? "");
            }}
            list="consultant-names"
            required
          />
          <datalist id="consultant-names">
            {consultants?.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </Field>
        <Field>
          <Label>Question</Label>
          <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createRfi.isPending}>
            {createRfi.isPending ? "Raising…" : "Raise RFI"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
