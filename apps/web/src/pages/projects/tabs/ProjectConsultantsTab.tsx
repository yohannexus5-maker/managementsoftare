import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Card, Button, StatusPill, Input, Select, Field, Label } from "../../../components/ui";
import { useAuth } from "../../../auth/AuthContext";
import type { ProjectDetailDto } from "../../../features/projects/types";
import { useConsultants } from "../../../features/consultants/hooks";
import { useContracts, useCreateContract } from "../../../features/contracts/hooks";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export function ProjectConsultantsTab({ project }: { project: ProjectDetailDto }) {
  const { can } = useAuth();
  const canManage = can("MANAGE_CONSULTANTS");
  const { data: consultants } = useConsultants();
  const { data: contracts } = useContracts({ projectId: project.id });
  const createContract = useCreateContract();

  const [consultantId, setConsultantId] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [fee, setFee] = useState("");
  const [retentionPct, setRetentionPct] = useState("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!consultantId || !scopeOfWork || !fee) return;
    await createContract.mutateAsync({
      consultantId,
      projectId: project.id,
      scopeOfWork,
      fee: Number(fee),
      retentionPct: retentionPct ? Number(retentionPct) : undefined,
    });
    setConsultantId("");
    setScopeOfWork("");
    setFee("");
    setRetentionPct("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-2 overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">
          Consultant contracts
        </div>
        {!contracts?.length ? (
          <div className="px-5 py-8 text-center text-sm text-ink-500">No consultants engaged yet.</div>
        ) : (
          contracts.map((c) => (
            <div key={c.id} className="border-b border-ink-100 px-5 py-4 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink-900">{c.consultant?.name}</div>
                  <div className="text-xs text-ink-500">{c.scopeOfWork}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-900">{formatMoney(c.fee)}</span>
                  <StatusPill status={c.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {canManage && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Engage a consultant</h3>
          <form onSubmit={handleAdd}>
            <Field>
              <Label>Consultant</Label>
              <Select value={consultantId} onChange={(e) => setConsultantId(e.target.value)} required>
                <option value="">Select…</option>
                {consultants?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Scope of work</Label>
              <Input value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <Label>Fee (INR)</Label>
                <Input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} required />
              </Field>
              <Field>
                <Label>Retention %</Label>
                <Input type="number" min="0" max="100" value={retentionPct} onChange={(e) => setRetentionPct(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" className="w-full justify-center" disabled={createContract.isPending}>
              <Plus size={15} /> Add contract
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
