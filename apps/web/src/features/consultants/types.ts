export interface ConsultantListItemDto {
  id: string;
  name: string;
  category: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rating: number | null;
  notes: string | null;
  _count: { contracts: number };
}

export interface PaymentMilestoneDto {
  id: string;
  contractId: string;
  description: string;
  amount: number;
  dueDate: string | null;
  status: string;
}

export interface ContractDto {
  id: string;
  consultantId: string;
  projectId: string;
  scopeOfWork: string;
  fee: number;
  retentionPct: number | null;
  status: string;
  consultant?: ConsultantListItemDto;
  project?: { id: string; name: string };
  paymentMilestones: PaymentMilestoneDto[];
}

export interface DeliverableDto {
  id: string;
  projectId: string;
  ownerType: string;
  teamMemberId: string | null;
  consultantId: string | null;
  title: string;
  dueDate: string | null;
  status: string;
  currentRevision: string | null;
  project?: { id: string; name: string };
}

export interface DrawingExchangeDto {
  id: string;
  drawingNumber: string;
  title: string;
  revision: string;
  status: string;
  issueDate: string | null;
  project?: { id: string; name: string };
}

export interface ConsultantRfiDto {
  id: string;
  question: string;
  response: string | null;
  status: string;
  createdAt: string;
  project?: { id: string; name: string };
}

export interface ConsultantDetailDto extends ConsultantListItemDto {
  contracts: ContractDto[];
  deliverables: DeliverableDto[];
  drawingsExchanged: DrawingExchangeDto[];
  rfis: ConsultantRfiDto[];
}
