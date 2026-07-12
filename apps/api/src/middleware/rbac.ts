import type { NextFunction, Request, Response } from "express";
import { hasPermission, Role, type Permission } from "@apms/shared";
import { forbidden, unauthorized } from "./errors";
import { prisma } from "../lib/prisma";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!hasPermission(req.user.role as Role, permission)) {
      return next(forbidden(`Missing permission: ${permission}`));
    }
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role as Role)) {
      return next(forbidden(`Requires role: ${roles.join(" or ")}`));
    }
    next();
  };
}

/** Roles that can see every project in their office without explicit membership. */
const OFFICE_WIDE_ROLES: Role[] = [Role.PRINCIPAL, Role.ADMIN_MANAGER];

/**
 * Returns true if the given user is allowed to read/act on the given project,
 * based on role + explicit project membership / consultant contract / client link.
 */
export async function canAccessProject(
  user: { sub: string; role: string; officeId: string },
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, officeId: user.officeId },
    select: { id: true, clientId: true, leadArchitectId: true },
  });
  if (!project) return false;

  if (OFFICE_WIDE_ROLES.includes(user.role as Role)) return true;

  if (user.role === Role.PROJECT_ARCHITECT || user.role === Role.DESIGN_TEAM) {
    if (project.leadArchitectId === user.sub) return true;
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.sub } },
    });
    return !!membership;
  }

  if (user.role === Role.CONSULTANT) {
    const person = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!person?.consultantId) return false;
    const contract = await prisma.consultantContract.findUnique({
      where: { consultantId_projectId: { consultantId: person.consultantId, projectId } },
    });
    return !!contract;
  }

  if (user.role === Role.CLIENT) {
    const person = await prisma.user.findUnique({ where: { id: user.sub } });
    return !!person?.clientId && person.clientId === project.clientId;
  }

  return false;
}

export function requireProjectAccess(paramName = "projectId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    const projectId = req.params[paramName] ?? req.body?.[paramName] ?? req.query?.[paramName];
    if (!projectId || typeof projectId !== "string") return next(forbidden("Missing projectId"));

    const allowed = await canAccessProject(req.user, projectId);
    if (!allowed) return next(forbidden("No access to this project"));
    next();
  };
}

/** Prisma `where` fragment that scopes a Project query to what this user may see. */
export async function projectScopeWhere(user: { sub: string; role: string; officeId: string }) {
  if (OFFICE_WIDE_ROLES.includes(user.role as Role)) {
    return { officeId: user.officeId };
  }

  if (user.role === Role.PROJECT_ARCHITECT || user.role === Role.DESIGN_TEAM) {
    return {
      officeId: user.officeId,
      OR: [{ leadArchitectId: user.sub }, { members: { some: { userId: user.sub } } }],
    };
  }

  if (user.role === Role.CONSULTANT) {
    const person = await prisma.user.findUnique({ where: { id: user.sub } });
    return {
      officeId: user.officeId,
      consultantContracts: { some: { consultantId: person?.consultantId ?? "__none__" } },
    };
  }

  if (user.role === Role.CLIENT) {
    const person = await prisma.user.findUnique({ where: { id: user.sub } });
    return { officeId: user.officeId, clientId: person?.clientId ?? "__none__" };
  }

  return { officeId: user.officeId, id: "__none__" };
}
