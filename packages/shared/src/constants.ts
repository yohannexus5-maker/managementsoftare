export const DEFAULT_PHASE_TEMPLATE = [
  "Concept",
  "Schematic Design",
  "Design Development",
  "Construction Documentation",
  "Tender",
  "Construction / Site Supervision",
  "Handover",
] as const;

export const DEFAULT_CONSULTANT_CATEGORIES = [
  "Structural",
  "MEP",
  "Landscape",
  "Interior Design",
  "PMC",
  "Acoustics",
  "Facade",
  "Vendor",
] as const;

export const DEFAULT_STATUTORY_CHECKLIST = [
  "Land Use / Zoning Clearance",
  "Building Plan Sanction",
  "Environmental NOC",
  "Fire NOC",
  "Structural Stability Certificate",
  "Occupancy Certificate",
] as const;

export const DOCUMENT_CATEGORIES = [
  "DRAWING",
  "CONTRACT",
  "APPROVAL",
  "CORRESPONDENCE",
  "PHOTO",
  "OTHER",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DRAWING_STATUSES = ["WIP", "ISSUED", "APPROVED"] as const;
export type DrawingStatus = (typeof DRAWING_STATUSES)[number];

export const RFI_STATUSES = ["OPEN", "RESPONDED", "CLOSED"] as const;
export type RfiStatus = (typeof RFI_STATUSES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DELIVERABLE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "OVERDUE",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const INVOICE_TYPES = ["CLIENT", "CONSULTANT"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const LEAVE_TYPES = ["ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_ENTITY_TYPES = ["DRAWING", "INVOICE", "CONTRACT"] as const;
export type ApprovalEntityType = (typeof APPROVAL_ENTITY_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "DEADLINE_DUE",
  "OVERDUE",
  "RFI_RAISED",
  "RFI_RESPONDED",
  "APPROVAL_REQUESTED",
  "APPROVAL_DECIDED",
  "SUBMISSION_RECEIVED",
  "LEAVE_REQUESTED",
  "LEAVE_DECIDED",
  "TASK_ASSIGNED",
  "MENTION",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const SKILLS_SUGGESTIONS = [
  "Facade Detailing",
  "3D Visualization",
  "BIM / Revit",
  "Landscape Design",
  "Interior Detailing",
  "Structural Coordination",
  "MEP Coordination",
  "Site Supervision",
  "Statutory Approvals",
  "Sustainability / Green Building",
] as const;
