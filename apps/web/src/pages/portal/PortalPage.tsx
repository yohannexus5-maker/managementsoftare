import { useRef, useState } from "react";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import { Role } from "@apms/shared";
import { PageHeader, Card, Button, StatusPill, Spinner, EmptyState } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { useProjects, useProject } from "../../features/projects/hooks";
import { useDeliverables, useUpdateDeliverable } from "../../features/deliverables/hooks";
import { useRfis, useRespondRfi } from "../../features/rfis/hooks";
import { useDocuments, useUploadDocument, openDocument } from "../../features/documents/hooks";
import type { ProjectListItemDto } from "../../features/projects/types";

export default function PortalPage() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();

  return (
    <div>
      <PageHeader
        title={user?.role === Role.CONSULTANT ? "My Projects" : "My Projects"}
        description={
          user?.role === Role.CONSULTANT
            ? "Deliverables, RFIs, and drawings for your engagements."
            : "Milestones, progress, and shared files for your projects."
        }
      />
      {isLoading ? (
        <Spinner />
      ) : !projects?.length ? (
        <EmptyState title="No projects yet" />
      ) : (
        <div className="space-y-6">
          {projects.map((p) =>
            user?.role === Role.CONSULTANT ? (
              <ConsultantProjectPanel key={p.id} project={p} />
            ) : (
              <ClientProjectPanel key={p.id} project={p} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ConsultantProjectPanel({ project }: { project: ProjectListItemDto }) {
  const { data: deliverables } = useDeliverables({ projectId: project.id });
  const { data: rfis } = useRfis(project.id);
  const updateDeliverable = useUpdateDeliverable();
  const respondRfi = useRespondRfi();
  const uploadDocument = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  async function handleFileSelected(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", project.id);
    form.append("name", file.name);
    form.append("category", "DRAWING");
    await uploadDocument.mutateAsync(form);
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 px-5 py-3">
        <div className="text-sm font-semibold text-ink-900">{project.name}</div>
        <div className="text-xs text-ink-500">{project.client.name}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-ink-100">
        <div>
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <span>Your deliverables</span>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-ink-600 hover:text-ink-900">
              <Upload size={13} /> Upload drawing
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
          </div>
          {!deliverables?.length ? (
            <div className="px-5 py-4 text-sm text-ink-500">No deliverables assigned.</div>
          ) : (
            deliverables.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">{d.title}</div>
                  {d.dueDate && <div className="text-xs text-ink-500">Due {format(new Date(d.dueDate), "d MMM yyyy")}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={d.status} />
                  {d.status !== "SUBMITTED" && d.status !== "APPROVED" && (
                    <Button variant="ghost" onClick={() => updateDeliverable.mutate({ id: d.id, status: "SUBMITTED" })}>
                      Mark submitted
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="border-b border-ink-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            RFIs to you
          </div>
          {!rfis?.length ? (
            <div className="px-5 py-4 text-sm text-ink-500">No open queries.</div>
          ) : (
            rfis.map((rfi) => (
              <div key={rfi.id} className="border-b border-ink-100 px-5 py-3 last:border-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-900">{rfi.question}</span>
                  <StatusPill status={rfi.status} />
                </div>
                {rfi.status === "OPEN" &&
                  (respondingId === rfi.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="flex-1 rounded border border-ink-300 px-2 py-1 text-sm"
                        placeholder="Type response…"
                      />
                      <Button
                        onClick={async () => {
                          await respondRfi.mutateAsync({ id: rfi.id, response: responseText });
                          setRespondingId(null);
                          setResponseText("");
                        }}
                      >
                        Send
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" onClick={() => setRespondingId(rfi.id)}>
                      Respond
                    </Button>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

function ClientProjectPanel({ project }: { project: ProjectListItemDto }) {
  const { data: detail } = useProject(project.id);
  const { data: documents } = useDocuments(project.id);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 px-5 py-3">
        <div className="text-sm font-semibold text-ink-900">{project.name}</div>
        <div className="text-xs text-ink-500">{project.typology}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-ink-100">
        <div>
          <div className="border-b border-ink-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Milestones
          </div>
          {!detail?.milestones.length ? (
            <div className="px-5 py-4 text-sm text-ink-500">No milestones yet.</div>
          ) : (
            detail.milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="text-xs text-ink-500">Due {format(new Date(m.dueDate), "d MMM yyyy")}</div>
                </div>
                <StatusPill status={m.status} />
              </div>
            ))
          )}
        </div>

        <div>
          <div className="border-b border-ink-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Shared files
          </div>
          {!documents?.length ? (
            <div className="px-5 py-4 text-sm text-ink-500">No files shared yet.</div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => openDocument(doc.id)}
                className="flex w-full items-center justify-between border-b border-ink-100 px-5 py-3 text-left last:border-0 hover:bg-ink-50"
              >
                <span className="text-sm font-medium text-ink-900">{doc.name}</span>
                <span className="text-xs text-ink-500">{doc.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
