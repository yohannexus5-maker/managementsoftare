import { prisma } from "./prisma";

interface AuditParams {
  userId: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "LOGIN";
  entityType: string;
  entityId: string;
  changes?: unknown;
}

export async function recordAudit({ userId, action, entityType, entityId, changes }: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      changes: changes !== undefined ? JSON.stringify(changes) : null,
    },
  });
}
