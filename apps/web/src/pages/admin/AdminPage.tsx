import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Button, Input, Select, StatusPill } from "../../components/ui";
import {
  usePhaseTemplates,
  useAddPhaseTemplate,
  useDeletePhaseTemplate,
  useConsultantCategories,
  useAddConsultantCategory,
  useDeleteConsultantCategory,
  useStatutoryTemplates,
  useAddStatutoryTemplate,
  useDeleteStatutoryTemplate,
  useApprovalChains,
  useUpdateApprovalChain,
  useAdminUsers,
  useUpdateAdminUser,
  type ConfigItem,
} from "../../features/admin/hooks";
import { api } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";

const TABS = [
  { key: "phases", label: "Project Phases" },
  { key: "categories", label: "Consultant Categories" },
  { key: "statutory", label: "Statutory Checklist" },
  { key: "approvals", label: "Approval Chains" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit Log" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ConfigListPanel({
  items,
  onAdd,
  onDelete,
  placeholder,
}: {
  items: ConfigItem[] | undefined;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  placeholder: string;
}) {
  const [name, setName] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  }

  return (
    <Card className="max-w-xl overflow-hidden">
      <form onSubmit={handleSubmit} className="flex gap-2 border-b border-ink-200 p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="flex-1" />
        <Button type="submit">
          <Plus size={15} />
        </Button>
      </form>
      {items?.map((item, i) => (
        <div key={item.id} className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5 last:border-0">
          <span className="text-sm text-ink-900">
            {i + 1}. {item.name}
          </span>
          <button onClick={() => onDelete(item.id)} className="text-ink-400 hover:text-danger-600">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {!items?.length && <div className="px-4 py-6 text-center text-sm text-ink-500">Nothing configured yet.</div>}
    </Card>
  );
}

function ApprovalChainsPanel() {
  const { data: chains } = useApprovalChains();
  const updateChain = useUpdateApprovalChain();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <Card className="max-w-xl overflow-hidden">
      {chains?.map((chain) => (
        <div key={chain.entityType} className="border-b border-ink-100 px-5 py-4 last:border-0">
          <div className="mb-2 text-sm font-medium text-ink-900">{chain.entityType}</div>
          <div className="flex gap-2">
            <Input
              defaultValue={chain.rolesCsv}
              placeholder="ROLE_A,ROLE_B"
              onChange={(e) => setDrafts((d) => ({ ...d, [chain.entityType]: e.target.value }))}
              className="flex-1"
            />
            <Button
              variant="secondary"
              onClick={() =>
                updateChain.mutate({ entityType: chain.entityType, rolesCsv: drafts[chain.entityType] ?? chain.rolesCsv })
              }
            >
              Save
            </Button>
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Comma-separated roles in approval order, e.g. PROJECT_ARCHITECT,PRINCIPAL
          </p>
        </div>
      ))}
    </Card>
  );
}

function UsersPanel() {
  const { data } = useAdminUsers();
  const updateUser = useUpdateAdminUser();

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Role</th>
            <th className="px-5 py-3 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((u) => (
            <tr key={u.id} className="border-b border-ink-100 last:border-0">
              <td className="px-5 py-3 font-medium text-ink-900">{u.name}</td>
              <td className="px-5 py-3 text-ink-600">{u.email}</td>
              <td className="px-5 py-3">
                <Select
                  value={u.role}
                  className="w-44"
                  onChange={(e) => updateUser.mutate({ id: u.id, role: e.target.value })}
                >
                  {data.roles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </td>
              <td className="px-5 py-3">
                <button
                  onClick={() => updateUser.mutate({ id: u.id, active: !u.active })}
                  className={u.active ? "" : "opacity-50"}
                >
                  <StatusPill status={u.active ? "ACTIVE" : "ON_HOLD"} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function AuditLogPanel() {
  const { data } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => (await api.get("/audit")).data.logs as {
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      createdAt: string;
      user: { id: string; name: string } | null;
    }[],
  });

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-5 py-3 font-medium">When</th>
            <th className="px-5 py-3 font-medium">User</th>
            <th className="px-5 py-3 font-medium">Action</th>
            <th className="px-5 py-3 font-medium">Entity</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((log) => (
            <tr key={log.id} className="border-b border-ink-100 last:border-0">
              <td className="px-5 py-3 text-ink-600">{format(new Date(log.createdAt), "d MMM yyyy, h:mm a")}</td>
              <td className="px-5 py-3 text-ink-900">{log.user?.name ?? "System"}</td>
              <td className="px-5 py-3">
                <StatusPill status={log.action} />
              </td>
              <td className="px-5 py-3 text-ink-600">{log.entityType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>("phases");

  const { data: phases } = usePhaseTemplates();
  const addPhase = useAddPhaseTemplate();
  const deletePhase = useDeletePhaseTemplate();

  const { data: categories } = useConsultantCategories();
  const addCategory = useAddConsultantCategory();
  const deleteCategory = useDeleteConsultantCategory();

  const { data: statutory } = useStatutoryTemplates();
  const addStatutory = useAddStatutoryTemplate();
  const deleteStatutory = useDeleteStatutoryTemplate();

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Configure how this office structures projects, consultants, and approvals — new projects pick these up automatically."
      />

      <div className="mb-6 flex gap-1 border-b border-ink-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "border-ink-900 text-ink-900" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "phases" && (
        <ConfigListPanel
          items={phases}
          onAdd={(name) => addPhase.mutate({ name })}
          onDelete={(id) => deletePhase.mutate(id)}
          placeholder="e.g. Concept Design"
        />
      )}
      {tab === "categories" && (
        <ConfigListPanel
          items={categories}
          onAdd={(name) => addCategory.mutate({ name })}
          onDelete={(id) => deleteCategory.mutate(id)}
          placeholder="e.g. Vertical Transportation"
        />
      )}
      {tab === "statutory" && (
        <ConfigListPanel
          items={statutory}
          onAdd={(name) => addStatutory.mutate({ name })}
          onDelete={(id) => deleteStatutory.mutate(id)}
          placeholder="e.g. Fire NOC"
        />
      )}
      {tab === "approvals" && <ApprovalChainsPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "audit" && <AuditLogPanel />}
    </div>
  );
}
