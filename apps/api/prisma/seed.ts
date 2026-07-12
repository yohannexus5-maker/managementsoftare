import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_PHASE_TEMPLATE,
  DEFAULT_CONSULTANT_CATEGORIES,
  DEFAULT_STATUTORY_CHECKLIST,
  SKILLS_SUGGESTIONS,
  Role,
} from "@apms/shared";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  console.log("Seeding demo data...");

  const office = await prisma.office.create({
    data: { name: "Studio Meridian Architects" },
  });

  await prisma.phaseTemplate.createMany({
    data: DEFAULT_PHASE_TEMPLATE.map((name, i) => ({ officeId: office.id, name, order: i })),
  });

  await prisma.consultantCategoryConfig.createMany({
    data: DEFAULT_CONSULTANT_CATEGORIES.map((name) => ({ officeId: office.id, name })),
  });

  await prisma.statutoryChecklistTemplate.createMany({
    data: DEFAULT_STATUTORY_CHECKLIST.map((name) => ({ officeId: office.id, name })),
  });

  await prisma.approvalChainConfig.createMany({
    data: [
      { officeId: office.id, entityType: "DRAWING", rolesCsv: "PROJECT_ARCHITECT,PRINCIPAL" },
      { officeId: office.id, entityType: "INVOICE", rolesCsv: "ADMIN_MANAGER,PRINCIPAL" },
      { officeId: office.id, entityType: "CONTRACT", rolesCsv: "PRINCIPAL" },
    ],
  });

  const skills = await Promise.all(
    SKILLS_SUGGESTIONS.map((name) => prisma.skill.create({ data: { name } }))
  );
  const skillByName = Object.fromEntries(skills.map((s) => [s.name, s]));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const principal = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "principal@studiomeridian.com",
      passwordHash,
      name: "Ananya Rao",
      role: Role.PRINCIPAL,
      seniority: "Partner",
    },
  });

  const architect = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "architect@studiomeridian.com",
      passwordHash,
      name: "Kabir Mehta",
      role: Role.PROJECT_ARCHITECT,
      seniority: "Senior Architect",
      skills: { connect: [{ id: skillByName["BIM / Revit"].id }, { id: skillByName["Site Supervision"].id }] },
    },
  });

  const designer1 = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "designer1@studiomeridian.com",
      passwordHash,
      name: "Priya Nair",
      role: Role.DESIGN_TEAM,
      seniority: "Associate",
      skills: { connect: [{ id: skillByName["Facade Detailing"].id }, { id: skillByName["3D Visualization"].id }] },
    },
  });

  const designer2 = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "designer2@studiomeridian.com",
      passwordHash,
      name: "Rohan Verma",
      role: Role.DESIGN_TEAM,
      seniority: "Junior Architect",
      skills: { connect: [{ id: skillByName["Interior Detailing"].id }, { id: skillByName["MEP Coordination"].id }] },
    },
  });

  const adminManager = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "admin@studiomeridian.com",
      passwordHash,
      name: "Sunita Iyer",
      role: Role.ADMIN_MANAGER,
      seniority: "Office Manager",
    },
  });

  const clientOrg = await prisma.client.create({
    data: {
      officeId: office.id,
      name: "Vantage Developers Pvt Ltd",
      contactName: "Arjun Malhotra",
      contactEmail: "arjun@vantagedevelopers.com",
      contactPhone: "+91 98200 11223",
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "client@vantagedevelopers.com",
      passwordHash,
      name: "Arjun Malhotra",
      role: Role.CLIENT,
      clientId: clientOrg.id,
    },
  });

  const structuralConsultant = await prisma.consultant.create({
    data: {
      officeId: office.id,
      name: "Bedrock Structural Consultants",
      category: "Structural",
      contactName: "Dev Kulkarni",
      contactEmail: "dev@bedrockstructural.com",
      contactPhone: "+91 99200 44556",
      rating: 4.5,
    },
  });

  const mepConsultant = await prisma.consultant.create({
    data: {
      officeId: office.id,
      name: "ClimaTech MEP Engineers",
      category: "MEP",
      contactName: "Farah Sheikh",
      contactEmail: "farah@climatechmep.com",
      contactPhone: "+91 98100 77889",
      rating: 4,
    },
  });

  const consultantUser = await prisma.user.create({
    data: {
      officeId: office.id,
      email: "consultant@bedrockstructural.com",
      passwordHash,
      name: "Dev Kulkarni",
      role: Role.CONSULTANT,
      consultantId: structuralConsultant.id,
    },
  });

  const phaseNames = DEFAULT_PHASE_TEMPLATE;

  async function createProject(opts: {
    name: string;
    typology: string;
    fee: number;
    siteAddress: string;
    currentPhaseIndex: number;
  }) {
    const project = await prisma.project.create({
      data: {
        officeId: office.id,
        name: opts.name,
        clientId: clientOrg.id,
        typology: opts.typology,
        scope: `Full architectural services for ${opts.name}`,
        siteAddress: opts.siteAddress,
        fee: opts.fee,
        startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        leadArchitectId: architect.id,
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: architect.id, roleOnProject: "Lead Architect" },
        { projectId: project.id, userId: designer1.id, roleOnProject: "Design Team" },
        { projectId: project.id, userId: designer2.id, roleOnProject: "Design Team" },
      ],
    });

    const phases = await Promise.all(
      phaseNames.map((name, i) =>
        prisma.projectPhase.create({
          data: {
            projectId: project.id,
            name,
            order: i,
            status: i < opts.currentPhaseIndex ? "COMPLETE" : i === opts.currentPhaseIndex ? "IN_PROGRESS" : "PENDING",
            startDate: new Date(Date.now() + (i - opts.currentPhaseIndex) * 20 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + (i - opts.currentPhaseIndex + 1) * 20 * 24 * 60 * 60 * 1000),
          },
        })
      )
    );
    const currentPhase = phases[opts.currentPhaseIndex];

    await prisma.milestone.createMany({
      data: [
        {
          projectId: project.id,
          phaseId: currentPhase.id,
          title: `${currentPhase.name} sign-off`,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          projectId: project.id,
          title: "Client design review",
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        },
        {
          projectId: project.id,
          title: "Statutory submission deadline",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: "OVERDUE",
        },
      ],
    });

    await prisma.statutoryApprovalItem.createMany({
      data: DEFAULT_STATUTORY_CHECKLIST.map((name, i) => ({
        projectId: project.id,
        name,
        status: i === 0 ? "APPROVED" : i === 1 ? "SUBMITTED" : "PENDING",
      })),
    });

    const structContract = await prisma.consultantContract.create({
      data: {
        consultantId: structuralConsultant.id,
        projectId: project.id,
        scopeOfWork: "Structural design & drawings for RCC frame",
        fee: opts.fee * 0.12,
        retentionPct: 5,
        status: "ACTIVE",
      },
    });
    await prisma.paymentMilestone.createMany({
      data: [
        { contractId: structContract.id, description: "Advance", amount: structContract.fee * 0.2, status: "PAID" },
        { contractId: structContract.id, description: "On DD submission", amount: structContract.fee * 0.4, status: "INVOICED" },
        { contractId: structContract.id, description: "On completion", amount: structContract.fee * 0.4, status: "PENDING" },
      ],
    });

    const mepContract = await prisma.consultantContract.create({
      data: {
        consultantId: mepConsultant.id,
        projectId: project.id,
        scopeOfWork: "MEP design coordination",
        fee: opts.fee * 0.08,
        retentionPct: 5,
        status: "ACTIVE",
      },
    });
    await prisma.paymentMilestone.create({
      data: { contractId: mepContract.id, description: "Advance", amount: mepContract.fee * 0.3, status: "PAID" },
    });

    await prisma.deliverable.createMany({
      data: [
        {
          projectId: project.id,
          ownerType: "CONSULTANT",
          consultantId: structuralConsultant.id,
          title: "Structural DD drawings",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          phaseId: currentPhase.id,
          status: "IN_PROGRESS",
        },
        {
          projectId: project.id,
          ownerType: "TEAM",
          teamMemberId: designer1.id,
          title: "Facade detail drawings",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          phaseId: currentPhase.id,
          status: "UNDER_REVIEW",
          currentRevision: "R2",
        },
      ],
    });

    await prisma.drawingRegisterEntry.createMany({
      data: [
        {
          projectId: project.id,
          drawingNumber: "A-101",
          title: "Ground Floor Plan",
          revision: "R2",
          status: "ISSUED",
          issueDate: new Date(),
          issuedTo: "Client, Structural Consultant",
        },
        {
          projectId: project.id,
          drawingNumber: "A-201",
          title: "Elevations",
          revision: "R1",
          status: "WIP",
        },
      ],
    });

    await prisma.rFI.createMany({
      data: [
        {
          projectId: project.id,
          raisedById: designer2.id,
          raisedTo: "Bedrock Structural Consultants",
          consultantId: structuralConsultant.id,
          question: "Confirm column grid spacing at basement level clashes with ramp.",
          status: "OPEN",
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
        {
          projectId: project.id,
          raisedById: architect.id,
          raisedTo: "ClimaTech MEP Engineers",
          consultantId: mepConsultant.id,
          question: "Shaft size for AHU riser on typical floor?",
          response: "600x900mm confirmed, drawing to follow.",
          status: "RESPONDED",
          respondedAt: new Date(),
        },
      ],
    });

    const siteVisit = await prisma.siteVisitLog.create({
      data: {
        projectId: project.id,
        visitedById: architect.id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: "Reviewed foundation excavation progress; minor deviation on grid line 4 flagged to contractor.",
      },
    });
    await prisma.siteVisitActionItem.create({
      data: {
        siteVisitId: siteVisit.id,
        description: "Contractor to submit rectified excavation levels",
        assigneeId: architect.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          phaseId: currentPhase.id,
          assigneeId: designer1.id,
          title: "Develop facade detailing package",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          estimatedHours: 24,
        },
        {
          projectId: project.id,
          phaseId: currentPhase.id,
          assigneeId: designer2.id,
          title: "Coordinate MEP shaft locations",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          estimatedHours: 12,
        },
        {
          projectId: project.id,
          assigneeId: architect.id,
          title: "Review structural DD set",
          status: "REVIEW",
          priority: "URGENT",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          estimatedHours: 6,
        },
      ],
    });

    await prisma.timesheet.createMany({
      data: [
        { userId: designer1.id, projectId: project.id, date: new Date(Date.now() - 86400000), hours: 6, approvalStatus: "APPROVED" },
        { userId: designer2.id, projectId: project.id, date: new Date(Date.now() - 86400000), hours: 5, approvalStatus: "PENDING" },
        { userId: architect.id, projectId: project.id, date: new Date(), hours: 4, approvalStatus: "PENDING" },
      ],
    });

    const meeting = await prisma.meeting.create({
      data: {
        projectId: project.id,
        title: "Design coordination meeting #4",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: "Studio Meridian office",
        minutes: "Reviewed facade material palette, discussed MEP shaft coordination, structural DD timeline confirmed.",
        createdById: architect.id,
      },
    });
    await prisma.meetingParticipant.createMany({
      data: [
        { meetingId: meeting.id, userId: architect.id },
        { meetingId: meeting.id, userId: designer1.id },
        { meetingId: meeting.id, name: "Dev Kulkarni (Bedrock Structural)" },
      ],
    });
    await prisma.meetingActionItem.create({
      data: {
        meetingId: meeting.id,
        description: "Circulate updated facade material palette to client",
        assigneeId: designer1.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.invoice.createMany({
      data: [
        {
          projectId: project.id,
          type: "CLIENT",
          amount: opts.fee * 0.25,
          status: "SENT",
          issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          description: `${currentPhase.name} phase fee`,
          createdById: adminManager.id,
        },
        {
          projectId: project.id,
          type: "CONSULTANT",
          consultantContractId: structContract.id,
          amount: structContract.fee * 0.4,
          status: "DRAFT",
          description: "Structural DD submission milestone",
          createdById: adminManager.id,
        },
      ],
    });

    return project;
  }

  const projectOne = await createProject({
    name: "Vantage Residency Tower",
    typology: "Residential High-Rise",
    fee: 8_500_000,
    siteAddress: "Plot 22, Sector 44, Gurugram",
    currentPhaseIndex: 2,
  });

  await createProject({
    name: "Meridian Business Park",
    typology: "Commercial Office Campus",
    fee: 15_000_000,
    siteAddress: "NH8 Corridor, Manesar",
    currentPhaseIndex: 1,
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: principal.id,
        type: "APPROVAL_REQUESTED",
        title: "Invoice pending your approval",
        body: "Vantage Residency Tower — client invoice awaiting sign-off",
      },
      {
        userId: architect.id,
        type: "RFI_RAISED",
        title: "New RFI raised on Vantage Residency Tower",
        body: "Column grid spacing clash at basement level",
        link: `/projects/${projectOne.id}?tab=rfis`,
      },
      {
        userId: designer1.id,
        type: "TASK_ASSIGNED",
        title: "You were assigned: Develop facade detailing package",
        link: `/projects/${projectOne.id}?tab=tasks`,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login password for all seeded users:", DEMO_PASSWORD);
  console.log("  Principal:        principal@studiomeridian.com");
  console.log("  Project Architect:architect@studiomeridian.com");
  console.log("  Design Team:      designer1@studiomeridian.com / designer2@studiomeridian.com");
  console.log("  Admin Manager:    admin@studiomeridian.com");
  console.log("  Consultant:       consultant@bedrockstructural.com");
  console.log("  Client:           client@vantagedevelopers.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
