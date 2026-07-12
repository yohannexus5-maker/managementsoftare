import { useRef, useState } from "react";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import { DOCUMENT_CATEGORIES } from "@apms/shared";
import { Card, Button, Select } from "../../../components/ui";
import { useDocuments, useUploadDocument, openDocument } from "../../../features/documents/hooks";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDocumentsTab({ projectId }: { projectId: string }) {
  const [category, setCategory] = useState("");
  const { data: documents } = useDocuments(projectId, category || undefined);
  const uploadDocument = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", projectId);
    form.append("name", file.name);
    form.append("category", category || "OTHER");
    await uploadDocument.mutateAsync(form);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploadDocument.isPending}>
          <Upload size={15} /> {uploadDocument.isPending ? "Uploading…" : "Upload document"}
        </Button>
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

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Uploaded by</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {documents?.map((doc) => (
              <tr key={doc.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-5 py-3">
                  <button onClick={() => openDocument(doc.id)} className="font-medium text-ink-900 hover:underline">
                    {doc.name}
                  </button>
                </td>
                <td className="px-5 py-3 text-ink-600">{doc.category}</td>
                <td className="px-5 py-3 text-ink-600">R{doc.version}</td>
                <td className="px-5 py-3 text-ink-600">{formatSize(doc.size)}</td>
                <td className="px-5 py-3 text-ink-600">{doc.uploadedBy.name}</td>
                <td className="px-5 py-3 text-ink-600">{format(new Date(doc.createdAt), "d MMM yyyy")}</td>
              </tr>
            ))}
            {!documents?.length && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
