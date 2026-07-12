import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { Card, StatusPill, Spinner } from "../../components/ui";
import { useConsultant } from "../../features/consultants/hooks";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function ConsultantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: consultant, isLoading } = useConsultant(id);

  if (isLoading) return <Spinner />;
  if (!consultant) return <div className="text-sm text-ink-500">Consultant not found.</div>;

  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-accent-700">{consultant.category}</div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">{consultant.name}</h1>
        {consultant.rating != null && (
          <span className="flex items-center gap-1 text-sm text-ink-700">
            <Star size={16} className="fill-warn-600 text-warn-600" />
            {consultant.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-ink-400">Contact</div>
          <div className="mt-1 text-ink-900">{consultant.contactName ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-ink-400">Email</div>
          <div className="mt-1 text-ink-900">{consultant.contactEmail ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-ink-400">Phone</div>
          <div className="mt-1 text-ink-900">{consultant.contactPhone ?? "—"}</div>
        </Card>
      </div>

      <Card className="mb-6 overflow-x-auto">
        <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">
          Contracts &amp; payment tracking
        </div>
        {consultant.contracts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-500">No contracts yet.</div>
        ) : (
          consultant.contracts.map((contract) => (
            <div key={contract.id} className="border-b border-ink-100 px-5 py-4 last:border-0">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <Link to={`/projects/${contract.projectId}`} className="font-medium text-ink-900 hover:underline">
                    {contract.project?.name}
                  </Link>
                  <div className="text-xs text-ink-500">{contract.scopeOfWork}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-900">{formatMoney(contract.fee)}</span>
                  <StatusPill status={contract.status} />
                </div>
              </div>
              {contract.paymentMilestones.length > 0 && (
                <table className="w-full text-xs">
                  <tbody>
                    {contract.paymentMilestones.map((pm) => (
                      <tr key={pm.id} className="border-t border-ink-100">
                        <td className="py-1.5 text-ink-600">{pm.description}</td>
                        <td className="py-1.5 text-ink-900">{formatMoney(pm.amount)}</td>
                        <td className="py-1.5">
                          <StatusPill status={pm.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">
            Deliverable tracker
          </div>
          {consultant.deliverables.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-500">No deliverables yet.</div>
          ) : (
            consultant.deliverables.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">{d.title}</div>
                  <div className="text-xs text-ink-500">
                    {d.project?.name} {d.dueDate && `· Due ${format(new Date(d.dueDate), "d MMM yyyy")}`}
                  </div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">
            Drawing exchange log
          </div>
          {consultant.drawingsExchanged.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-500">No drawings exchanged yet.</div>
          ) : (
            consultant.drawingsExchanged.map((dr) => (
              <div key={dr.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">
                    {dr.drawingNumber} · {dr.title}
                  </div>
                  <div className="text-xs text-ink-500">
                    {dr.project?.name} · Rev {dr.revision}
                  </div>
                </div>
                <StatusPill status={dr.status} />
              </div>
            ))
          )}
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">RFI thread</div>
        {consultant.rfis.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-500">No RFIs raised with this consultant.</div>
        ) : (
          consultant.rfis.map((rfi) => (
            <div key={rfi.id} className="border-b border-ink-100 px-5 py-3 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-sm font-medium text-ink-900">{rfi.project?.name}</div>
                <StatusPill status={rfi.status} />
              </div>
              <div className="text-sm text-ink-700">{rfi.question}</div>
              {rfi.response && <div className="mt-1 text-sm text-ink-500">↳ {rfi.response}</div>}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
