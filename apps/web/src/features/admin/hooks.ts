import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface ConfigItem {
  id: string;
  name: string;
  jurisdiction?: string | null;
}

export interface ApprovalChainItem {
  entityType: string;
  id?: string;
  rolesCsv: string;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  seniority: string | null;
  active: boolean;
}

function useConfigList(key: string, path: string) {
  return useQuery({
    queryKey: ["admin", key],
    queryFn: async () => (await api.get<{ items: ConfigItem[] }>(path)).data.items,
  });
}

function useAddConfigItem(key: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; jurisdiction?: string }) => (await api.post(path, body)).data.item,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", key] }),
  });
}

function useDeleteConfigItem(key: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`${path}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", key] }),
  });
}

export const usePhaseTemplates = () => useConfigList("phase-templates", "/admin/phase-templates");
export const useAddPhaseTemplate = () => useAddConfigItem("phase-templates", "/admin/phase-templates");
export const useDeletePhaseTemplate = () => useDeleteConfigItem("phase-templates", "/admin/phase-templates");

export const useConsultantCategories = () => useConfigList("consultant-categories", "/admin/consultant-categories");
export const useAddConsultantCategory = () => useAddConfigItem("consultant-categories", "/admin/consultant-categories");
export const useDeleteConsultantCategory = () => useDeleteConfigItem("consultant-categories", "/admin/consultant-categories");

export const useStatutoryTemplates = () => useConfigList("statutory-templates", "/admin/statutory-templates");
export const useAddStatutoryTemplate = () => useAddConfigItem("statutory-templates", "/admin/statutory-templates");
export const useDeleteStatutoryTemplate = () => useDeleteConfigItem("statutory-templates", "/admin/statutory-templates");

export function useApprovalChains() {
  return useQuery({
    queryKey: ["admin", "approval-chains"],
    queryFn: async () => (await api.get<{ items: ApprovalChainItem[] }>("/admin/approval-chains")).data.items,
  });
}

export function useUpdateApprovalChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityType, rolesCsv }: { entityType: string; rolesCsv: string }) =>
      (await api.put(`/admin/approval-chains/${entityType}`, { rolesCsv })).data.item,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "approval-chains"] }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get<{ users: AdminUserDto[]; roles: string[] }>("/admin/users")).data,
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; active?: boolean; role?: string }) =>
      (await api.patch(`/admin/users/${id}`, input)).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
