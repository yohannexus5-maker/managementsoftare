// Named re-exports (not `export *`) on purpose: some bundlers' CJS/ESM
// interop can fail to statically detect exports funnelled through a
// wildcard re-export chain. Explicit names are detected reliably everywhere.

export {
  Role,
  ALL_ROLES,
  INTERNAL_ROLES,
  PORTAL_ROLES,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
} from "./roles";

export {
  DEFAULT_PHASE_TEMPLATE,
  DEFAULT_CONSULTANT_CATEGORIES,
  DEFAULT_STATUTORY_CHECKLIST,
  DOCUMENT_CATEGORIES,
  DRAWING_STATUSES,
  RFI_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PROJECT_STATUSES,
  DELIVERABLE_STATUSES,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  LEAVE_TYPES,
  APPROVAL_STATUSES,
  APPROVAL_ENTITY_TYPES,
  NOTIFICATION_TYPES,
  SKILLS_SUGGESTIONS,
} from "./constants";
export type {
  DocumentCategory,
  DrawingStatus,
  RfiStatus,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  DeliverableStatus,
  InvoiceType,
  InvoiceStatus,
  LeaveType,
  ApprovalStatus,
  ApprovalEntityType,
  NotificationType,
} from "./constants";

export { loginSchema, createUserSchema, updateUserSchema } from "./schemas/auth";
export type { LoginInput, CreateUserInput, UpdateUserInput } from "./schemas/auth";

export {
  createProjectSchema,
  updateProjectSchema,
  createClientSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createStatutoryItemSchema,
  updateStatutoryItemSchema,
} from "./schemas/project";
export type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateClientInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateStatutoryItemInput,
  UpdateStatutoryItemInput,
} from "./schemas/project";

export {
  createConsultantSchema,
  updateConsultantSchema,
  createContractSchema,
  updateContractSchema,
  createPaymentMilestoneSchema,
  updatePaymentMilestoneSchema,
  createDeliverableSchema,
  updateDeliverableSchema,
} from "./schemas/consultant";
export type {
  CreateConsultantInput,
  UpdateConsultantInput,
  CreateContractInput,
  UpdateContractInput,
  CreatePaymentMilestoneInput,
  UpdatePaymentMilestoneInput,
  CreateDeliverableInput,
  UpdateDeliverableInput,
} from "./schemas/consultant";

export {
  createTaskSchema,
  updateTaskSchema,
  createTimesheetSchema,
  updateTimesheetSchema,
  createLeaveRequestSchema,
  decideLeaveRequestSchema,
} from "./schemas/team";
export type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateTimesheetInput,
  UpdateTimesheetInput,
  CreateLeaveRequestInput,
  DecideLeaveRequestInput,
} from "./schemas/team";

export {
  createDrawingSchema,
  updateDrawingSchema,
  createRfiSchema,
  respondRfiSchema,
  updateRfiSchema,
  createSiteVisitSchema,
  createDocumentMetaSchema,
} from "./schemas/documents";
export type {
  CreateDrawingInput,
  UpdateDrawingInput,
  CreateRfiInput,
  RespondRfiInput,
  UpdateRfiInput,
  CreateSiteVisitInput,
  CreateDocumentMetaInput,
} from "./schemas/documents";

export { createMeetingSchema, updateMeetingSchema } from "./schemas/meeting";
export type { CreateMeetingInput, UpdateMeetingInput } from "./schemas/meeting";

export { createInvoiceSchema, updateInvoiceSchema } from "./schemas/invoice";
export type { CreateInvoiceInput, UpdateInvoiceInput } from "./schemas/invoice";
