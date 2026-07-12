export const Role = {
  PRINCIPAL: "PRINCIPAL",
  PROJECT_ARCHITECT: "PROJECT_ARCHITECT",
  DESIGN_TEAM: "DESIGN_TEAM",
  ADMIN_MANAGER: "ADMIN_MANAGER",
  CONSULTANT: "CONSULTANT",
  CLIENT: "CLIENT",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: Role[] = Object.values(Role);

/** Roles that are internal staff of the practice (have a normal desk login, not a portal-only login). */
export const INTERNAL_ROLES: Role[] = [
  Role.PRINCIPAL,
  Role.PROJECT_ARCHITECT,
  Role.DESIGN_TEAM,
  Role.ADMIN_MANAGER,
];

export const PORTAL_ROLES: Role[] = [Role.CONSULTANT, Role.CLIENT];

export const Permission = {
  VIEW_ALL_PROJECTS: "VIEW_ALL_PROJECTS",
  MANAGE_PROJECT: "MANAGE_PROJECT",
  VIEW_FINANCIALS: "VIEW_FINANCIALS",
  MANAGE_FINANCIALS: "MANAGE_FINANCIALS",
  APPROVE_INVOICE: "APPROVE_INVOICE",
  APPROVE_DRAWING: "APPROVE_DRAWING",
  APPROVE_CONTRACT: "APPROVE_CONTRACT",
  MANAGE_CONSULTANTS: "MANAGE_CONSULTANTS",
  MANAGE_TEAM: "MANAGE_TEAM",
  MANAGE_HR: "MANAGE_HR",
  APPROVE_LEAVE: "APPROVE_LEAVE",
  MANAGE_TASKS: "MANAGE_TASKS",
  LOG_TIMESHEET: "LOG_TIMESHEET",
  MANAGE_DOCUMENTS: "MANAGE_DOCUMENTS",
  UPLOAD_DOCUMENTS: "UPLOAD_DOCUMENTS",
  MANAGE_RFI: "MANAGE_RFI",
  RESPOND_RFI: "RESPOND_RFI",
  MANAGE_ADMIN_CONFIG: "MANAGE_ADMIN_CONFIG",
  VIEW_AUDIT_LOG: "VIEW_AUDIT_LOG",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.PRINCIPAL]: Object.values(Permission),
  [Role.PROJECT_ARCHITECT]: [
    Permission.MANAGE_PROJECT,
    Permission.VIEW_FINANCIALS,
    Permission.APPROVE_DRAWING,
    Permission.MANAGE_CONSULTANTS,
    Permission.MANAGE_TEAM,
    Permission.APPROVE_LEAVE,
    Permission.MANAGE_TASKS,
    Permission.LOG_TIMESHEET,
    Permission.MANAGE_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_RFI,
    Permission.RESPOND_RFI,
  ],
  [Role.DESIGN_TEAM]: [
    Permission.LOG_TIMESHEET,
    Permission.UPLOAD_DOCUMENTS,
    Permission.RESPOND_RFI,
  ],
  [Role.ADMIN_MANAGER]: [
    Permission.VIEW_ALL_PROJECTS,
    Permission.VIEW_FINANCIALS,
    Permission.MANAGE_FINANCIALS,
    Permission.APPROVE_INVOICE,
    Permission.MANAGE_CONSULTANTS,
    Permission.MANAGE_HR,
    Permission.APPROVE_LEAVE,
    Permission.MANAGE_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_ADMIN_CONFIG,
    Permission.VIEW_AUDIT_LOG,
  ],
  [Role.CONSULTANT]: [Permission.UPLOAD_DOCUMENTS, Permission.RESPOND_RFI],
  [Role.CLIENT]: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
