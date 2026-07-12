import { useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "../../components/ui";
import { useProject } from "../../features/projects/hooks";
import { ProjectOverviewTab } from "./tabs/ProjectOverviewTab";
import { ProjectMilestonesTab } from "./tabs/ProjectMilestonesTab";
import { ProjectStatutoryTab } from "./tabs/ProjectStatutoryTab";
import { ProjectConsultantsTab } from "./tabs/ProjectConsultantsTab";
import { ProjectDrawingsTab } from "./tabs/ProjectDrawingsTab";
import { ProjectRfisTab } from "./tabs/ProjectRfisTab";
import { ProjectSiteVisitsTab } from "./tabs/ProjectSiteVisitsTab";
import { ProjectDocumentsTab } from "./tabs/ProjectDocumentsTab";
import { ProjectTeamTasksTab } from "./tabs/ProjectTeamTasksTab";
import { ProjectMeetingsTab } from "./tabs/ProjectMeetingsTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "milestones", label: "Phases & Milestones" },
  { key: "team", label: "Team & Tasks" },
  { key: "consultants", label: "Consultants" },
  { key: "drawings", label: "Drawings" },
  { key: "rfis", label: "RFIs" },
  { key: "sitevisits", label: "Site Visits" },
  { key: "documents", label: "Documents" },
  { key: "meetings", label: "Meetings" },
  { key: "statutory", label: "Statutory" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const [tab, setTab] = useState<TabKey>("overview");

  if (isLoading) return <Spinner />;
  if (!project) return <div className="text-sm text-ink-500">Project not found.</div>;

  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-ink-400">{project.client.name}</div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-900 tracking-tight">{project.name}</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <ProjectOverviewTab project={project} />}
      {tab === "milestones" && <ProjectMilestonesTab project={project} />}
      {tab === "team" && <ProjectTeamTasksTab project={project} />}
      {tab === "consultants" && <ProjectConsultantsTab project={project} />}
      {tab === "drawings" && <ProjectDrawingsTab projectId={project.id} />}
      {tab === "rfis" && <ProjectRfisTab projectId={project.id} />}
      {tab === "sitevisits" && <ProjectSiteVisitsTab projectId={project.id} />}
      {tab === "documents" && <ProjectDocumentsTab projectId={project.id} />}
      {tab === "meetings" && <ProjectMeetingsTab projectId={project.id} />}
      {tab === "statutory" && <ProjectStatutoryTab project={project} />}
    </div>
  );
}
