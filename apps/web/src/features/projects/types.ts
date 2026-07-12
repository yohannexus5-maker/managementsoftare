export interface ProjectPhaseDto {
  id: string;
  name: string;
  order: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface MilestoneDto {
  id: string;
  projectId: string;
  phaseId: string | null;
  title: string;
  dueDate: string;
  status: string;
  reminderDaysBefore: number | null;
}

export interface StatutoryItemDto {
  id: string;
  name: string;
  jurisdiction: string | null;
  status: string;
  submittedDate: string | null;
  approvedDate: string | null;
  notes: string | null;
}

export interface ProjectMemberDto {
  id: string;
  userId: string;
  roleOnProject: string | null;
  user: { id: string; name: string; email: string; role: string };
}

export interface ProjectListItemDto {
  id: string;
  name: string;
  typology: string;
  status: string;
  fee: number | null;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string };
  leadArchitect: { id: string; name: string } | null;
  phases: ProjectPhaseDto[];
  _count: { tasks: number; rfis: number; milestones: number };
}

export interface ProjectDetailDto extends Omit<ProjectListItemDto, "_count"> {
  scope: string | null;
  siteAddress: string | null;
  members: ProjectMemberDto[];
  milestones: MilestoneDto[];
  statutoryItems: StatutoryItemDto[];
}
