import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { INVOICE_TYPES } from "@apms/shared";
import { PageHeader, Card, Button, StatusPill, Spinner, Modal, Field, Label, Input, Select, Textarea } from "../../components/ui";
import { useFinancialsOverview } from "../../features/financials/hooks";
import { useInvoices, useCreateInvoice, useUpdateInvoice } from "../../features/invoices/hooks";
import { useProjects } from "../../features/projects/hooks";
import { useContracts } from "../../features/contracts/hooks";
import { useRequestApproval } from "../../features/approvals/hooks";

function money(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function FinancialsPage() {
  const [tab, setTab] = useState<"overview" | "invoices">("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: overview, isLoading } = useFinancialsOverview();
  const { data: invoices } = useInvoices();
  const updateInvoice = useUpdateInvoice();
  const requestApproval = useRequestApproval();

  return (
    <div>
      <PageHeader
        title="Financials"
        description="Fees invoiced vs. collected, consultant payments, and project profitability."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New invoice
          </Button>
        }
      />

      <div className="mb-6 flex gap-1 border-b border-ink-200">
        {[
          { key: "overview", label: "Project overview" },
          { key: "invoices", label: "Invoices" },
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

      {tab === "overview" &&
        (isLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-ink-400">Total fee</div>
                <div className="mt-1 text-xl font-semibold text-ink-900">{money(overview?.totals.fee ?? 0)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-ink-400">Collected</div>
                <div className="mt-1 text-xl font-semibold text-ok-600">{money(overview?.totals.feeCollected ?? 0)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-ink-400">Consultant payments</div>
                <div className="mt-1 text-xl font-semibold text-ink-900">{money(overview?.totals.consultantPaid ?? 0)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-ink-400">Est. profitability</div>
                <div
                  className={`mt-1 text-xl font-semibold ${
                    (overview?.totals.profitability ?? 0) >= 0 ? "text-ok-600" : "text-danger-600"
                  }`}
                >
                  {money(overview?.totals.profitability ?? 0)}
                </div>
              </Card>
            </div>

            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Fee</th>
                    <th className="px-5 py-3 font-medium">Invoiced</th>
                    <th className="px-5 py-3 font-medium">Collected</th>
                    <th className="px-5 py-3 font-medium">Consultant budget</th>
                    <th className="px-5 py-3 font-medium">Consultant paid</th>
                    <th className="px-5 py-3 font-medium">Profitability*</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.projects.map((p) => (
                    <tr key={p.projectId} className="border-b border-ink-100 last:border-0">
                      <td className="px-5 py-3 font-medium text-ink-900">{p.projectName}</td>
                      <td className="px-5 py-3 text-ink-600">{money(p.fee)}</td>
                      <td className="px-5 py-3 text-ink-600">{money(p.feeInvoiced)}</td>
                      <td className="px-5 py-3 text-ink-600">{money(p.feeCollected)}</td>
                      <td className="px-5 py-3 text-ink-600">{money(p.consultantBudget)}</td>
                      <td className="px-5 py-3 text-ink-600">{money(p.consultantPaid)}</td>
                      <td className={`px-5 py-3 font-medium ${p.profitability >= 0 ? "text-ok-600" : "text-danger-600"}`}>
                        {money(p.profitability)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="mt-3 text-xs text-ink-400">
              *Profitability = fee − (approved team hours × ₹{overview?.assumedHourlyCostRate}/hr assumed blended
              cost rate) − consultant contract budget. Configure a real per-person cost rate for accurate figures.
            </p>
          </>
        ))}

      {tab === "invoices" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((inv) => (
                <tr key={inv.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 text-ink-900">{inv.project.name}</td>
                  <td className="px-5 py-3 text-ink-600">
                    {inv.type}
                    {inv.consultantContract && ` · ${inv.consultantContract.consultant.name}`}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{inv.description ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-900">{money(inv.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={inv.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {inv.status === "DRAFT" && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            requestApproval.mutate({ entityType: "INVOICE", entityId: inv.id, projectId: inv.projectId })
                          }
                        >
                          Request sign-off
                        </Button>
                      )}
                      {inv.status !== "PAID" && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            updateInvoice.mutate({ id: inv.id, status: "PAID", amountPaid: inv.amount, paidDate: new Date() })
                          }
                        >
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <NewInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function NewInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: projects } = useProjects();
  const createInvoice = useCreateInvoice();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<string>("CLIENT");
  const [consultantContractId, setConsultantContractId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const { data: contracts } = useContracts({ projectId });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !amount) return;
    await createInvoice.mutateAsync({
      projectId,
      type: type as (typeof INVOICE_TYPES)[number],
      consultantContractId: type === "CONSULTANT" ? consultantContractId || undefined : undefined,
      amount: Number(amount),
      description: description || undefined,
    });
    setAmount("");
    setDescription("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New invoice">
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
          <Label>Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {INVOICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        {type === "CONSULTANT" && (
          <Field>
            <Label>Consultant contract</Label>
            <Select value={consultantContractId} onChange={(e) => setConsultantContractId(e.target.value)}>
              <option value="">Select contract…</option>
              {contracts?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.consultant?.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field>
          <Label>Amount (INR)</Label>
          <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field>
          <Label>Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending ? "Creating…" : "Create invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
