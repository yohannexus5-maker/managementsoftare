import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface DocumentDto {
  id: string;
  projectId: string;
  name: string;
  category: string;
  version: number;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export function useDocuments(projectId: string, category?: string) {
  return useQuery({
    queryKey: ["documents", projectId, category],
    queryFn: async () =>
      (await api.get<{ documents: DocumentDto[] }>("/documents", { params: { projectId, category } })).data
        .documents,
    enabled: !!projectId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) =>
      (
        await api.post<{ document: DocumentDto }>("/documents", form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data.document,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

/**
 * The file endpoint requires a Bearer access token, which a plain <a href>
 * can't attach — fetch it through the authenticated api client instead and
 * open the resulting blob.
 */
export async function openDocument(id: string) {
  const res = await api.get(`/documents/${id}/file`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  window.open(url, "_blank");
}
