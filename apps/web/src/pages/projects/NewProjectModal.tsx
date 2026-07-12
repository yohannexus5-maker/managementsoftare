import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Field, Label, Input, Select, Button, Textarea } from "../../components/ui";
import { useClients } from "../../features/clients/hooks";
import { useTeamMembers } from "../../features/team/hooks";
import { useCreateProject } from "../../features/projects/hooks";

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: members } = useTeamMembers();
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [typology, setTypology] = useState("");
  const [scope, setScope] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [fee, setFee] = useState("");
  const [leadArchitectId, setLeadArchitectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const architects = members?.filter((m) => m.role === "PROJECT_ARCHITECT" || m.role === "PRINCIPAL") ?? [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !clientId || !typology) {
      setError("Name, client, and typology are required.");
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        name,
        clientId,
        typology,
        scope: scope || undefined,
        siteAddress: siteAddress || undefined,
        fee: fee ? Number(fee) : undefined,
        leadArchitectId: leadArchitectId || undefined,
      });
      onClose();
      navigate(`/projects/${project.id}`);
    } catch {
      setError("Could not create project.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Project name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field>
          <Label>Client</Label>
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Select client…</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Typology</Label>
          <Input
            value={typology}
            onChange={(e) => setTypology(e.target.value)}
            placeholder="e.g. Residential High-Rise"
            required
          />
        </Field>
        <Field>
          <Label>Site address</Label>
          <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
        </Field>
        <Field>
          <Label>Scope</Label>
          <Textarea rows={2} value={scope} onChange={(e) => setScope(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Fee (INR)</Label>
            <Input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
          </Field>
          <Field>
            <Label>Lead architect</Label>
            <Select value={leadArchitectId} onChange={(e) => setLeadArchitectId(e.target.value)}>
              <option value="">Unassigned</option>
              {architects.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {error && <div className="mb-3 text-sm text-danger-600">{error}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? "Creating…" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
