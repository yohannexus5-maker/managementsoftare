import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { PageHeader, Card, Button, EmptyState, Spinner } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { useConsultants } from "../../features/consultants/hooks";
import { NewConsultantModal } from "./NewConsultantModal";

export default function ConsultantsListPage() {
  const { can } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: consultants, isLoading } = useConsultants();

  return (
    <div>
      <PageHeader
        title="Consultants"
        description="Structural, MEP, landscape, and every other external specialist the practice works with."
        actions={can("MANAGE_CONSULTANTS") && <Button onClick={() => setModalOpen(true)}>Add consultant</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : !consultants?.length ? (
        <EmptyState title="No consultants yet" description="Add your first external consultant." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultants.map((c) => (
            <Link key={c.id} to={`/consultants/${c.id}`}>
              <Card className="p-5 hover:border-ink-400 transition-colors h-full">
                <div className="mb-1 text-xs uppercase tracking-wide text-accent-700">{c.category}</div>
                <div className="text-base font-semibold text-ink-900">{c.name}</div>
                {c.contactName && <div className="mt-1 text-sm text-ink-500">{c.contactName}</div>}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink-500">{c._count.contracts} contract{c._count.contracts === 1 ? "" : "s"}</span>
                  {c.rating != null && (
                    <span className="flex items-center gap-1 text-ink-700">
                      <Star size={14} className="fill-warn-600 text-warn-600" />
                      {c.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <NewConsultantModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
