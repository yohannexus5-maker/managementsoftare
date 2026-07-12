import { useState } from "react";
import { FileText, Sheet } from "lucide-react";
import { PageHeader, Card, Button, Select } from "../../components/ui";
import { useProjects } from "../../features/projects/hooks";
import { api } from "../../lib/api";

async function downloadFile(url: string, filename: string) {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export default function ReportsPage() {
  const { data: projects } = useProjects();
  const [projectId, setProjectId] = useState("");
  const project = projects?.find((p) => p.id === projectId);

  return (
    <div>
      <PageHeader title="Reports" description="Exportable project reports for client meetings, audits, or partner review." />

      <Card className="max-w-lg p-6">
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-ink-600">Project</label>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Select a project…</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            disabled={!projectId}
            onClick={() => downloadFile(`/reports/project/${projectId}/pdf`, `${project?.name}_report.pdf`)}
          >
            <FileText size={15} /> Download PDF
          </Button>
          <Button
            variant="secondary"
            disabled={!projectId}
            onClick={() => downloadFile(`/reports/project/${projectId}/excel`, `${project?.name}_report.xlsx`)}
          >
            <Sheet size={15} /> Download Excel
          </Button>
        </div>
      </Card>
    </div>
  );
}
