import { useState, type FormEvent } from "react";
import { DEFAULT_CONSULTANT_CATEGORIES } from "@apms/shared";
import { Modal, Field, Label, Input, Select, Button } from "../../components/ui";
import { useCreateConsultant } from "../../features/consultants/hooks";

export function NewConsultantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createConsultant = useCreateConsultant();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CONSULTANT_CATEGORIES[0]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !category) return;
    await createConsultant.mutateAsync({
      name,
      category,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
    });
    setName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add consultant">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Firm name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field>
          <Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {DEFAULT_CONSULTANT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Contact name</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field>
            <Label>Contact email</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>
          <Field>
            <Label>Contact phone</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createConsultant.isPending}>
            {createConsultant.isPending ? "Adding…" : "Add consultant"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
